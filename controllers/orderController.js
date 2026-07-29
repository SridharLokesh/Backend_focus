import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendMail, orderStatusMail } from '../utils/email.js';

// POST /api/orders — place order (users only)
export const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, orderItems, itemsPrice, totalPrice } = req.body;
    if (!orderItems?.length) return res.status(400).json({ message: 'No items in order' });

    const enrichedItems = [];
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product)
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity)
        return res.status(400).json({ message: `Insufficient stock for ${product.title}` });

      product.stock -= item.quantity;
      await product.save();

      enrichedItems.push({ ...item, dealer: product.dealer || null });
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems: enrichedItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      itemsPrice,
      totalPrice,
    });

    // Clear cart after order
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalPrice: 0 });

    // Notify dealers whose products are in this order
    const dealerIds = [...new Set(enrichedItems.filter(i => i.dealer).map(i => i.dealer.toString()))];
    for (const dealerId of dealerIds) {
      await Notification.create({
        recipient:     dealerId,
        recipientRole: 'dealer',
        type:          'new_order',
        title:         'New Order Received',
        message:       `New order #${order.invoiceNumber} placed for your product(s)`,
        link:          '/dealer/orders',
        refOrder:      order._id,
      });
    }

    // Notify buyer
    await Notification.create({
      recipient:     req.user._id,
      recipientRole: 'user',
      type:          'order_status',
      title:         'Order Placed!',
      message:       `Your order #${order.invoiceNumber} has been placed successfully`,
      link:          '/profile?tab=orders',
      refOrder:      order._id,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/my — user's own orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('orderItems.product', 'title image')
      .populate('orderItems.dealer', 'name businessName dealerId')
      .sort('-createdAt');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/all — admin all orders
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query  = status ? { orderStatus: status } : {};
    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ orders, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/dealer — dealer's orders
export const getDealerOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { 'orderItems.dealer': req.user._id };
    if (status) query.orderStatus = status;

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'title image price')
      .sort('-createdAt');

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'title image brand')
      .populate('orderItems.dealer', 'name businessName dealerId');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role === 'user' && order.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/orders/:id/cancel — user cancel
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    if (['Shipped', 'Delivered'].includes(order.orderStatus))
      return res.status(400).json({ message: 'Cannot cancel a shipped or delivered order' });

    // Restore stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    order.orderStatus = 'Cancelled';
    await order.save();

    await Notification.create({
      recipient:     req.user._id,
      recipientRole: 'user',
      type:          'order_status',
      title:         'Order Cancelled',
      message:       `Your order #${order.invoiceNumber} has been cancelled`,
      refOrder:      order._id,
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/orders/:id/dealer-status — dealer packs / ships
export const updateDealerStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    const allowed = ['Processing', 'Packed', 'Shipped'];
    if (!allowed.includes(status))
      return res.status(400).json({ message: 'Invalid status for dealer update' });

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const hasItem = order.orderItems.some(
      i => i.dealer?.toString() === req.user._id.toString()
    );
    if (!hasItem) return res.status(403).json({ message: 'Not authorized for this order' });

    if (status === 'Packed') {
      order.orderItems.forEach(item => {
        if (item.dealer?.toString() === req.user._id.toString())
          item.dealerPackedAt = new Date();
      });
    }

    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    await order.save();

    await Notification.create({
      recipient:     order.user._id,
      recipientRole: 'user',
      type:          'order_status',
      title:         `Order ${status}`,
      message:       `Your order #${order.invoiceNumber} is now ${status}${trackingNumber ? ` (Tracking: ${trackingNumber})` : ''}`,
      link:          '/profile?tab=orders',
      refOrder:      order._id,
    });

    await sendMail(orderStatusMail(order, order.user));
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/orders/:id/status — admin update
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, notes } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (notes)          order.notes          = notes;
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }
    await order.save();

    await Notification.create({
      recipient:     order.user._id,
      recipientRole: 'user',
      type:          'order_status',
      title:         `Order ${status}`,
      message:       `Your order #${order.invoiceNumber} has been marked as ${status}`,
      link:          '/profile?tab=orders',
      refOrder:      order._id,
    });

    await sendMail(orderStatusMail(order, order.user));
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/orders/:id/return — user requests return (within 7 days of delivery)
export const returnOrder = async (req, res) => {
  try {
    const { reason, itemIds } = req.body;
    if (!reason?.trim())
      return res.status(400).json({ message: 'Return reason is required' });

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    if (order.orderStatus !== 'Delivered')
      return res.status(400).json({ message: 'Only delivered orders can be returned' });

    const deliveryDate       = new Date(order.deliveredAt || order.updatedAt);
    const daysSinceDelivery  = Math.floor((Date.now() - deliveryDate) / (1000 * 60 * 60 * 24));
    if (daysSinceDelivery > 7)
      return res.status(400).json({ message: 'Return window has expired. Returns are accepted within 7 days of delivery.' });

    order.orderStatus = 'Returned';
    order.notes       = `Return reason: ${reason}`;
    await order.save();

    // Restore stock for returned items
    for (const item of order.orderItems) {
      if (!itemIds || itemIds.includes(item.product?.toString())) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    await Notification.create({
      recipient:     req.user._id,
      recipientRole: 'user',
      type:          'order_status',
      title:         'Return Request Submitted',
      message:       `Your return request for order #${order.invoiceNumber} has been submitted. Our team will process it within 3-5 business days.`,
      link:          '/profile?tab=returns',
      refOrder:      order._id,
    });

    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      await Notification.create({
        recipient:     admin._id,
        recipientRole: 'admin',
        type:          'complaint',
        title:         'New Return Request',
        message:       `${req.user.name} requested a return for order #${order.invoiceNumber}. Reason: ${reason}`,
        refOrder:      order._id,
      });
    }

    res.json({ message: 'Return request submitted successfully', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};