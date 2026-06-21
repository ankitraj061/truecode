'use client';
import { useState, ReactNode, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosClient } from '../utils/axiosClient';
import {
  Lock, Check, ShoppingCart, Star, Loader2,
  Pencil, Sparkles, Package, ChevronRight, X, ArrowLeft,
  MapPin, Gift,
} from 'lucide-react';
import Footer from '../components/Footer';

interface Product {
  id: number;
  name: string;
  points: number;
  image: string;
  description: string;
  color: string;
  badge: string | null;
}

interface Address {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface OrderStatusHistory {
  status: string;
  note: string;
  updatedAt: string;
}

interface MyOrder {
  _id: string;
  productName: string;
  pointsSpent: number;
  status: 'pending' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  address: Address;
  statusHistory: OrderStatusHistory[];
  createdAt: string;
}

const STATUS_STEPS: { key: MyOrder['status']; label: string }[] = [
  { key: 'pending',          label: 'Placed' },
  { key: 'packed',           label: 'Packed' },
  { key: 'shipped',          label: 'Shipped' },
  { key: 'out_for_delivery', label: 'On Way' },
  { key: 'delivered',        label: 'Delivered' },
];

const ADDRESS_FIELDS: { label: string; key: keyof Address; placeholder: string }[] = [
  { label: 'Full Name',          key: 'fullName', placeholder: 'John Doe' },
  { label: 'Phone Number',       key: 'phone',    placeholder: '+91 98765 43210' },
  { label: 'Street / House No.', key: 'street',   placeholder: '42, MG Road' },
  { label: 'City',               key: 'city',     placeholder: 'Bengaluru' },
  { label: 'State',              key: 'state',    placeholder: 'Karnataka' },
  { label: 'Pincode',            key: 'pincode',  placeholder: '560001' },
];

function getStatusIndex(status: MyOrder['status']): number {
  if (status === 'cancelled') return -1;
  return STATUS_STEPS.findIndex(s => s.key === status);
}

export default function RedeemProducts(): ReactNode {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalStep, setModalStep] = useState<'confirm' | 'address' | 'success'>('confirm');
  const [userPoints, setUserPoints] = useState<number>(0);
  const [redeemed, setRedeemed] = useState<number[]>([]);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [address, setAddress] = useState<Address>({
    fullName: '', phone: '', street: '', city: '', state: '', pincode: '',
  });
  const [addressEditable, setAddressEditable] = useState(true);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const ordersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        const res = await axiosClient.get('/api/user/points');
        if (res.data.success) setUserPoints(res.data.points || 0);
      } catch { /* silent */ }
    };
    const fetchMyOrders = async () => {
      try {
        const res = await axiosClient.get('/api/redeem/my');
        if (res.data.success) setMyOrders(res.data.orders || []);
      } catch { /* silent */ }
    };
    fetchUserPoints();
    fetchMyOrders();
  }, []);

  const products: Product[] = [
    { id: 1, name: 'T-Shirt',        points: 5000,  image: 'https://ik.imagekit.io/tvz1mupab/tshirt.png?updatedAt=1763209183166',                                              description: 'Premium coding platform t-shirt',   color: 'from-blue-500 to-cyan-500',     badge: 'Popular'    },
    { id: 2, name: 'Hoodie',         points: 8000,  image: 'https://ik.imagekit.io/tvz1mupab/hoody.png?updatedAt=1763209142519',                                               description: 'Cozy hoodie for coders',             color: 'from-purple-500 to-pink-500',   badge: 'Premium'    },
    { id: 3, name: 'Cap + Diary',    points: 4500,  image: 'https://ik.imagekit.io/tvz1mupab/dairy+cap.png?updatedAt=1763209225028',                                           description: 'Cap with bonus diary item',          color: 'from-orange-500 to-red-500',    badge: null         },
    { id: 4, name: 'Water Bottle',   points: 3500,  image: 'https://ik.imagekit.io/tvz1mupab/waterBottle.png?updatedAt=1763209022630',                                         description: 'Stainless steel water bottle',       color: 'from-green-500 to-teal-500',    badge: null         },
    { id: 5, name: 'Diary + Pen',    points: 0,     image: 'https://ik.imagekit.io/tvz1mupab/dairy+Pen.png?updatedAt=1763209062367',                                           description: 'Diary notebook with premium pen',   color: 'from-yellow-500 to-orange-500', badge: 'Free'       },
    { id: 6, name: 'Ultimate Bundle',points: 12000, image: 'https://ik.imagekit.io/tvz1mupab/allthings.png?updatedAt=1763209105542',                                           description: 'All items in one bundle',            color: 'from-pink-500 to-rose-500',     badge: 'Best Value' },
    { id: 7, name: 'Backpack',       points: 7500,  image: 'https://ik.imagekit.io/tvz1mupab/Gemini_Generated_Image_53sf2i53sf2i53sf.png?updatedAt=1763209660281',             description: 'Premium coding backpack',            color: 'from-indigo-500 to-blue-500',   badge: null         },
  ];

  const redeemableProducts = products.filter(p => p.points > 0);
  const minPoints = Math.min(...redeemableProducts.map(p => p.points));
  const progressPct = Math.min(100, Math.round((userPoints / minPoints) * 100));
  const canRedeem = (pts: number) => userPoints >= pts;
  const isRedeemed = (id: number) => redeemed.includes(id);

  const openProduct = (product: Product) => {
    setRedeemError(null);
    setModalStep('confirm');
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setModalStep('confirm');
    setRedeemError(null);
    setAddress({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '' });
    setAddressEditable(true);
  };

  const handleConfirmClick = async () => {
    if (!selectedProduct || !canRedeem(selectedProduct.points) || isRedeemed(selectedProduct.id)) return;
    setAddressLoading(true);
    setRedeemError(null);
    try {
      const res = await axiosClient.get('/api/redeem/my-address');
      if (res.data.success && res.data.address) {
        setAddress(res.data.address);
        setAddressEditable(false);
      } else {
        setAddress({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '' });
        setAddressEditable(true);
      }
    } catch {
      setAddress({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '' });
      setAddressEditable(true);
    } finally {
      setAddressLoading(false);
      setModalStep('address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedProduct) return;
    setRedeemLoading(true);
    setRedeemError(null);
    try {
      const res = await axiosClient.post('/api/redeem', {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        pointsSpent: selectedProduct.points,
        address,
      });
      if (res.data.success) {
        setUserPoints(prev => prev - selectedProduct.points);
        setRedeemed(prev => [...prev, selectedProduct.id]);
        try {
          const ordersRes = await axiosClient.get('/api/redeem/my');
          if (ordersRes.data.success) setMyOrders(ordersRes.data.orders || []);
        } catch { /* silent */ }
        setModalStep('success');
      } else {
        setRedeemError(res.data.error || 'Failed to place order. Please try again.');
      }
    } catch (err: unknown) {
      setRedeemError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setRedeemLoading(false);
    }
  };

  const scrollToOrders = () => {
    closeModal();
    setTimeout(() => ordersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const addressFilled =
    address.fullName && address.phone && address.street &&
    address.city && address.state && address.pincode;

  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* ── Hero / Header ─────────────────────────────────────────────────── */}
      <div className="bg-[var(--card)] border-b border-[var(--border)]">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 py-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-8">

            {/* Left: Title + nav */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                  <Sparkles className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h1 className="text-3xl font-bold text-[var(--foreground)]">Redeem Rewards</h1>
              </div>
              <p className="text-[var(--muted-foreground)] ml-14 text-sm">
                Unlock exclusive merchandise by earning points in contests
              </p>
              <Link
                href="/my-orders"
                className="inline-flex items-center gap-1.5 mt-3 ml-14 text-sm font-medium text-[var(--primary)] hover:opacity-80 transition-opacity"
              >
                <Package className="w-4 h-4" />
                View My Orders
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Right: Points card */}
            <div className="bg-[var(--background)] rounded-2xl p-5 border border-[var(--border)] w-full sm:w-auto sm:min-w-[260px] shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Your Points</p>
                </div>
                {userPoints >= minPoints && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Ready to redeem
                  </span>
                )}
              </div>
              <p className="text-4xl font-bold text-[var(--foreground)] mt-2 mb-1 tabular-nums">
                {userPoints.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mb-4">
                Earn points by solving problems and winning contests
              </p>
              <div>
                <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1.5">
                  <span>Progress to next reward</span>
                  <span className="font-bold text-[var(--foreground)]">{progressPct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-[var(--muted)]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  {userPoints >= minPoints
                    ? `You can redeem! ${(userPoints - minPoints).toLocaleString()} pts above minimum`
                    : `${(minPoints - userPoints).toLocaleString()} pts to cheapest item`}
                </p>
              </div>
            </div>

          </div>
        </motion.div>
      </div>

      {/* ── Products Grid ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

        <motion.div
          className="flex items-center gap-3 mb-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Gift className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Available Rewards</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
            {products.length} items
          </span>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {products.map((product) => {
            const locked = !canRedeem(product.points);
            const done = isRedeemed(product.id);
            const isFree = product.points === 0;

            return (
              <motion.div
                key={product.id}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.35 }}
                onClick={() => openProduct(product)}
                className="group relative cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
              >
                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-3 left-3 z-20">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full shadow-sm border ${
                        isFree
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-white/95 text-gray-800 border-white/60'
                      }`}
                    >
                      {isFree ? <Gift className="w-2.5 h-2.5" /> : <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />}
                      {product.badge}
                    </span>
                  </div>
                )}

                {/* Redeemed overlay */}
                {done && (
                  <div className="absolute inset-0 bg-emerald-500/15 backdrop-blur-[1px] flex items-center justify-center z-30 rounded-2xl">
                    <div className="flex flex-col items-center gap-2 bg-[var(--card)]/95 px-5 py-3 rounded-xl shadow-lg border border-emerald-500/20">
                      <Check className="w-7 h-7 text-emerald-500" />
                      <p className="text-emerald-600 font-bold text-sm">Redeemed!</p>
                    </div>
                  </div>
                )}

                {/* Gradient image area */}
                <div className={`relative h-48 bg-gradient-to-br ${product.color} flex items-center justify-center p-5 overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_60%)]" />
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-400"
                  />
                  {locked && !done && (
                    <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/25 backdrop-blur-sm">
                      <Lock className="w-3.5 h-3.5 text-white/80" />
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-bold text-[var(--foreground)] text-sm">{product.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{product.description}</p>
                  </div>

                  {/* Points */}
                  <div className="flex items-center justify-between">
                    {isFree ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-500">
                        <Gift className="w-4 h-4" /> Free
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        <span className="text-base font-bold text-[var(--foreground)] tabular-nums">
                          {product.points.toLocaleString()}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">pts</span>
                      </div>
                    )}
                    {!locked && !done && !isFree && (
                      <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Unlocked
                      </span>
                    )}
                  </div>

                  {/* CTA button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (!locked && !done) openProduct(product);
                    }}
                    disabled={locked && !isFree || done}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                      done
                        ? 'bg-emerald-500/10 text-emerald-600 cursor-default'
                        : canRedeem(product.points)
                        ? `bg-gradient-to-r ${product.color} text-white hover:shadow-md hover:opacity-95 active:scale-[0.97]`
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed opacity-50'
                    }`}
                  >
                    {done ? (
                      <><Check className="w-4 h-4" /> Redeemed</>
                    ) : canRedeem(product.points) ? (
                      <><ShoppingCart className="w-4 h-4" /> Redeem Now</>
                    ) : (
                      <><Lock className="w-4 h-4" /> {(product.points - userPoints).toLocaleString()} pts needed</>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── My Orders (inline preview) ────────────────────────────────────── */}
      {myOrders.length > 0 && (
        <div ref={ordersRef} className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-xl font-bold text-[var(--foreground)]">My Orders</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                {myOrders.length}
              </span>
            </div>
            <Link
              href="/my-orders"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:opacity-80 transition-opacity"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {myOrders.map((order) => {
              const currentIdx = getStatusIndex(order.status);
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
                >
                  {/* Status accent bar */}
                  <div className={`h-0.5 w-full ${order.status === 'delivered' ? 'bg-emerald-500' : order.status === 'cancelled' ? 'bg-red-500' : 'bg-[var(--primary)]'}`} />

                  <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <div>
                      <p className="font-semibold text-[var(--foreground)] text-sm">{order.productName}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                        <Star className="w-3 h-3 fill-current" />
                        {order.pointsSpent.toLocaleString()} pts
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    {order.status === 'cancelled' ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-semibold">
                        <X className="w-4 h-4" />
                        Order Cancelled
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {STATUS_STEPS.map((step, idx) => {
                          const reached = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;
                          return (
                            <div key={step.key} className="flex items-center flex-1 last:flex-none">
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <div
                                  className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                    reached
                                      ? 'bg-[var(--primary)]'
                                      : 'bg-[var(--muted)] border border-[var(--border)]'
                                  } ${isCurrent ? 'ring-2 ring-[var(--primary)]/25 ring-offset-1' : ''}`}
                                >
                                  {reached && <Check className="w-3.5 h-3.5 text-white" />}
                                  {isCurrent && <span className="absolute inset-0 rounded-full bg-[var(--primary)]/20 animate-ping" />}
                                </div>
                                <span className={`text-[9px] font-semibold text-center leading-tight ${reached ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}>
                                  {step.label}
                                </span>
                              </div>
                              {idx < STATUS_STEPS.length - 1 && (
                                <div className={`flex-1 h-[2px] mx-1 mb-4 rounded-full ${idx < currentIdx ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Redeem Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              className="max-w-md w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >

              {/* STEP: Confirm */}
              {modalStep === 'confirm' && (
                <>
                  <div className={`relative h-56 bg-gradient-to-br ${selectedProduct.color} flex items-center justify-center p-6 flex-shrink-0 overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_60%)]" />
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="h-full w-full object-contain drop-shadow-2xl" />
                    <button onClick={closeModal} className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-black/35 transition-colors backdrop-blur-sm">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                      <h2 className="text-2xl font-bold text-[var(--foreground)]">{selectedProduct.name}</h2>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">{selectedProduct.description}</p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)]">
                      <span className="text-sm font-medium text-[var(--muted-foreground)]">Points Required</span>
                      <div className="flex items-center gap-1.5">
                        {selectedProduct.points === 0 ? (
                          <span className="text-xl font-bold text-emerald-500 flex items-center gap-1.5">
                            <Gift className="w-5 h-5" /> Free
                          </span>
                        ) : (
                          <>
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-2xl font-bold text-[var(--foreground)] tabular-nums">{selectedProduct.points.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
                      canRedeem(selectedProduct.points)
                        ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-600'
                        : 'bg-red-500/8 border-red-500/20 text-red-500'
                    }`}>
                      {canRedeem(selectedProduct.points) ? (
                        <><Check className="w-4 h-4 flex-shrink-0" />
                          {selectedProduct.points === 0
                            ? 'This item is free!'
                            : `${(userPoints - selectedProduct.points).toLocaleString()} pts remaining after redeem`}
                        </>
                      ) : (
                        <><Lock className="w-4 h-4 flex-shrink-0" /> Need {(selectedProduct.points - userPoints).toLocaleString()} more points</>
                      )}
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={closeModal}
                        className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--foreground)] font-semibold text-sm hover:bg-[var(--muted)] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmClick}
                        disabled={!canRedeem(selectedProduct.points) || isRedeemed(selectedProduct.id) || addressLoading}
                        className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                          canRedeem(selectedProduct.points) && !isRedeemed(selectedProduct.id) && !addressLoading
                            ? `bg-gradient-to-r ${selectedProduct.color} text-white hover:opacity-90 active:scale-[0.98]`
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed opacity-60'
                        }`}
                      >
                        {addressLoading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
                          : <><ShoppingCart className="w-4 h-4" /> Continue</>
                        }
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* STEP: Address */}
              {modalStep === 'address' && (
                <div className="flex flex-col h-full">
                  <div className="p-5 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setModalStep('confirm'); setRedeemError(null); }}
                        className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </button>
                      <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[var(--primary)]" />
                        Delivery Address
                      </h2>
                    </div>
                    {!addressEditable && (
                      <button
                        onClick={() => setAddressEditable(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] text-xs font-semibold hover:bg-[var(--muted)] transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </div>

                  <div className="p-5 space-y-3 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-3">
                      {ADDRESS_FIELDS.map(({ label, key, placeholder }) => (
                        <div key={key} className={key === 'street' || key === 'fullName' ? 'col-span-2' : ''}>
                          <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] mb-1 uppercase tracking-wider">{label}</label>
                          <input
                            type="text"
                            value={address[key]}
                            onChange={e => setAddress(prev => ({ ...prev, [key]: e.target.value }))}
                            placeholder={placeholder}
                            disabled={!addressEditable}
                            className="input text-sm w-full"
                            style={{ opacity: addressEditable ? 1 : 0.7 }}
                          />
                        </div>
                      ))}
                    </div>

                    {redeemError && (
                      <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-sm font-medium flex items-center gap-2">
                        <X className="w-4 h-4 flex-shrink-0" /> {redeemError}
                      </div>
                    )}

                    <button
                      onClick={handlePlaceOrder}
                      disabled={redeemLoading || !addressFilled}
                      className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-all mt-1 ${
                        !redeemLoading && addressFilled
                          ? `bg-gradient-to-r ${selectedProduct.color} text-white hover:opacity-90 active:scale-[0.98]`
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed opacity-60'
                      }`}
                    >
                      {redeemLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing…</>
                        : <><ShoppingCart className="w-4 h-4" /> Place Order</>
                      }
                    </button>
                  </div>
                </div>
              )}

              {/* STEP: Success */}
              {modalStep === 'success' && (
                <div className="p-10 flex flex-col items-center text-center space-y-5">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center"
                  >
                    <Check className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-1.5">Order Placed!</h2>
                    <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">
                      Your <span className="font-semibold text-[var(--foreground)]">{selectedProduct.name}</span> is on its way.
                      We&apos;ll keep you updated as your order progresses.
                    </p>
                  </div>
                  <div className="w-full space-y-2.5 pt-2">
                    <button
                      onClick={scrollToOrders}
                      className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r ${selectedProduct.color} text-white hover:opacity-90 transition-opacity`}
                    >
                      <Package className="w-4 h-4" /> View My Orders
                    </button>
                    <button
                      onClick={closeModal}
                      className="w-full py-2.5 rounded-xl font-semibold text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all border border-[var(--border)]"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
