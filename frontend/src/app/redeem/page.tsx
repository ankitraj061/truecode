'use client';
import { useState, ReactNode, useEffect, useRef } from 'react';
import Link from 'next/link';
import { axiosClient } from '../utils/axiosClient';
import { FiLock, FiCheck, FiShoppingCart, FiStar, FiTrendingUp, FiLoader, FiEdit2 } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
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
  { key: 'pending', label: 'Pending' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

function getStatusIndex(status: MyOrder['status']): number {
  if (status === 'cancelled') return -1;
  return STATUS_STEPS.findIndex((s) => s.key === status);
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
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [addressEditable, setAddressEditable] = useState(true);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);

  const ordersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        const res = await axiosClient.get('/api/user/points');
        if (res.data.success) {
          setUserPoints(res.data.points || 0);
        }
      } catch {
        // points stay at 0 if API not available
      }
    };

    const fetchMyOrders = async () => {
      try {
        const res = await axiosClient.get('/api/redeem/my');
        if (res.data.success) {
          setMyOrders(res.data.orders || []);
        }
      } catch {
        // orders stay empty if API not available
      }
    };

    fetchUserPoints();
    fetchMyOrders();
  }, []);

  const products: Product[] = [
    {
      id: 1,
      name: 'T-Shirt',
      points: 5000,
      image: 'https://ik.imagekit.io/tvz1mupab/tshirt.png?updatedAt=1763209183166',
      description: 'Premium coding platform t-shirt',
      color: 'from-blue-500 to-cyan-500',
      badge: 'Popular'
    },
    {
      id: 2,
      name: 'Hoodie',
      points: 8000,
      image: 'https://ik.imagekit.io/tvz1mupab/hoody.png?updatedAt=1763209142519',
      description: 'Cozy hoodie for coders',
      color: 'from-purple-500 to-pink-500',
      badge: 'Premium'
    },
    {
      id: 3,
      name: 'Cap + Dairy',
      points: 4500,
      image: 'https://ik.imagekit.io/tvz1mupab/dairy+cap.png?updatedAt=1763209225028',
      description: 'Cap with bonus dairy item',
      color: 'from-orange-500 to-red-500',
      badge: null
    },
    {
      id: 4,
      name: 'Water Bottle',
      points: 3500,
      image: 'https://ik.imagekit.io/tvz1mupab/waterBottle.png?updatedAt=1763209022630',
      description: 'Stainless steel water bottle',
      color: 'from-green-500 to-teal-500',
      badge: null
    },
    {
      id: 5,
      name: 'Dairy + Pen',
      points: 0,
      image: 'https://ik.imagekit.io/tvz1mupab/dairy+Pen.png?updatedAt=1763209062367',
      description: 'Dairy notebook with premium pen',
      color: 'from-yellow-500 to-orange-500',
      badge: null
    },
    {
      id: 6,
      name: 'Ultimate Bundle',
      points: 12000,
      image: 'https://ik.imagekit.io/tvz1mupab/allthings.png?updatedAt=1763209105542',
      description: 'All items in one bundle',
      color: 'from-pink-500 to-rose-500',
      badge: 'Best Value'
    },
    {
      id: 7,
      name: 'Backpack',
      points: 7500,
      image: 'https://ik.imagekit.io/tvz1mupab/Gemini_Generated_Image_53sf2i53sf2i53sf.png?updatedAt=1763209660281',
      description: 'Premium coding backpack',
      color: 'from-indigo-500 to-blue-500',
      badge: null
    }
  ];

  const minPoints = Math.min(...products.map((p) => p.points));

  const closeModal = () => {
    setSelectedProduct(null);
    setModalStep('confirm');
    setRedeemError(null);
    setAddress({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '' });
    setAddressEditable(true);
  };

  // Step 1: "Confirm" clicked → fetch last address, go to address step
  const handleConfirmClick = async () => {
    if (!selectedProduct) return;
    if (!canRedeem(selectedProduct.points) || isRedeemed(selectedProduct.id)) return;

    setAddressLoading(true);
    setRedeemError(null);

    try {
      const res = await axiosClient.get('/api/redeem/my-address');
      if (res.data.success && res.data.address) {
        setAddress(res.data.address);
        setAddressEditable(false); // pre-filled → show in read-only with Edit button
      } else {
        setAddress({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '' });
        setAddressEditable(true);
      }
    } catch {
      // no previous address — show empty form
      setAddress({ fullName: '', phone: '', street: '', city: '', state: '', pincode: '' });
      setAddressEditable(true);
    } finally {
      setAddressLoading(false);
      setModalStep('address');
    }
  };

  // Step 2: "Place Order" clicked → POST /api/redeem
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
        setUserPoints((prev) => prev - selectedProduct.points);
        setRedeemed((prev) => [...prev, selectedProduct.id]);
        // refresh orders
        try {
          const ordersRes = await axiosClient.get('/api/redeem/my');
          if (ordersRes.data.success) {
            setMyOrders(ordersRes.data.orders || []);
          }
        } catch {
          // ignore
        }
        setModalStep('success');
      } else {
        setRedeemError(res.data.message || 'Failed to place order. Please try again.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to place order. Please try again.';
      setRedeemError(message);
    } finally {
      setRedeemLoading(false);
    }
  };

  const canRedeem = (points: number): boolean => userPoints >= points;
  const isRedeemed = (id: number): boolean => redeemed.includes(id);

  // Progress toward the cheapest item
  const progressPct = Math.min(100, Math.round((userPoints / minPoints) * 100));

  const scrollToOrders = () => {
    closeModal();
    setTimeout(() => {
      ordersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto mb-12 p-8">
          <div className="flex items-start justify-between mb-8 gap-6 flex-wrap">
            <div>
              <h1 className="text-5xl font-bold mb-2 flex items-center gap-3 text-primary">
                <HiSparkles className="text-yellow-400" size={40} />
                Redeem Rewards
              </h1>
              <p className="text-lg text-secondary">
                Unlock exclusive merchandise by earning points in contests
              </p>
              <Link
                href="/my-orders"
                className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-brand hover:opacity-80 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z" />
                </svg>
                View My Orders →
              </Link>
            </div>

            {/* Points Stats Card */}
            <div
              className="rounded-2xl p-6 border-[4px] min-w-[220px]"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-primary)',
                boxShadow: '6px 6px 0px 0px rgba(0,0,0,0.4)'
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <FiStar className="text-yellow-400" size={18} />
                <p className="text-sm font-semibold text-secondary uppercase tracking-wide">
                  Your Points
                </p>
              </div>
              <p className="text-4xl font-extrabold text-primary mb-3">
                {userPoints.toLocaleString()}
              </p>
              <p className="text-xs text-secondary mb-2">
                Earn points by solving problems and winning contests
              </p>

              {/* Progress bar toward cheapest item */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-secondary mb-1">
                  <span>Next reward</span>
                  <span>{progressPct}%</span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-secondary mt-1">
                  {userPoints >= minPoints
                    ? 'You can redeem!'
                    : `${(minPoints - userPoints).toLocaleString()} pts to cheapest item`}
                </p>
              </div>
            </div>
          </div>

          {/* Info Bar */}
          <div
            className="rounded-xl p-4 flex items-center gap-3 transition-colors border"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
          >
            <FiTrendingUp className="text-brand" size={20} />
            <p className="text-secondary">
              Contests launching soon! Earn points and unlock premium merchandise.
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid — BRUTALIST STYLE */}
      <div className="max-w-7xl mx-auto p-8 bg-secondary">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative cursor-pointer transition-all duration-300 hover:-translate-x-2 hover:-translate-y-2 active:translate-x-1 active:translate-y-1"
              onClick={() => {
                setRedeemError(null);
                setModalStep('confirm');
                setSelectedProduct(product);
              }}
            >
              {/* BRUTALIST CARD — thick border + offset shadow */}
              <div
                className="relative rounded-xl overflow-hidden transition-all duration-300 border-[5px]"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-primary)',
                  boxShadow: '8px 8px 0px 0px rgba(0,0,0,0.4)'
                }}
              >

                {/* Top corner accent */}
                <div className={`absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br ${product.color} rotate-45 z-10`} />

                {/* Star marker */}
                <div className="absolute top-3 right-3 text-xl font-bold z-20 text-primary">★</div>

                {/* Grid pattern overlay */}
                <div
                  className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none z-[1]"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
                    backgroundSize: '8px 8px'
                  }}
                />

                {/* Badge — BRUTALIST style */}
                {product.badge && (
                  <div className="absolute top-4 left-4 z-20">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-extrabold border-[3px] rounded-md uppercase tracking-wider rotate-3 group-hover:-rotate-2 transition-transform`}
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-primary)',
                        boxShadow: '3px 3px 0px 0px rgba(0,0,0,0.4)'
                      }}
                    >
                      <FiStar size={12} />
                      {product.badge}
                    </span>
                  </div>
                )}

                {/* Redeemed overlay */}
                {isRedeemed(product.id) && (
                  <div className="absolute inset-0 bg-green-500/30 backdrop-blur-sm flex items-center justify-center z-30 border-[5px] border-green-600">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-16 h-16 bg-green-500 border-[4px] rounded-full flex items-center justify-center animate-bounce"
                        style={{
                          borderColor: 'var(--border-primary)',
                          boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.4)'
                        }}
                      >
                        <FiCheck size={32} className="text-white font-bold" />
                      </div>
                      <p className="text-green-700 font-extrabold text-lg uppercase tracking-wide">Redeemed!</p>
                    </div>
                  </div>
                )}

                {/* Title area — BRUTALIST gradient header */}
                <div className={`relative p-5 bg-gradient-to-r ${product.color} border-b-[5px] overflow-hidden z-[2]`} style={{ borderColor: 'var(--border-primary)' }}>
                  {/* Diagonal stripe */}
                  <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                      background:
                        'repeating-linear-gradient(45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 8px, transparent 8px, transparent 16px)'
                    }}
                  />
                  <h3 className="relative text-lg font-extrabold text-white uppercase tracking-wide line-clamp-2 z-10">
                    {product.name}
                  </h3>
                </div>

                {/* Product image */}
                <div
                  className="relative h-56 overflow-hidden flex items-center justify-center p-4 border-b-[3px]"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 relative z-[2]">
                  <p className="text-sm text-secondary font-semibold line-clamp-2">
                    {product.description}
                  </p>

                  {/* Points row with dashed divider */}
                  <div
                    className="flex items-center justify-between pt-3 border-t-[3px] border-dashed relative"
                    style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                  >
                    {/* Scissors icon */}
                    <span
                      className="absolute -top-4 left-1/2 -translate-x-1/2 px-2 text-lg rotate-90 text-primary"
                      style={{ backgroundColor: 'var(--bg-elevated)' }}
                    >
                      ✂
                    </span>

                    <div className="flex items-center gap-2">
                      <FiStar className="text-yellow-400" size={18} />
                      <span className="text-xl font-extrabold text-primary relative">
                        {product.points.toLocaleString()}
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-cyan-400 -z-10 opacity-50" />
                      </span>
                    </div>
                    {!canRedeem(product.points) && !isRedeemed(product.id) && (
                      <FiLock className="text-red-500" size={18} />
                    )}
                  </div>

                  {/* Redeem button — BRUTALIST */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canRedeem(product.points) && !isRedeemed(product.id)) {
                        setRedeemError(null);
                        setModalStep('confirm');
                        setSelectedProduct(product);
                      }
                    }}
                    disabled={!canRedeem(product.points) || isRedeemed(product.id)}
                    className={`w-full py-3 font-extrabold transition-all duration-200 flex items-center justify-center gap-2 text-sm uppercase tracking-wide border-[3px] rounded-lg overflow-hidden relative ${
                      isRedeemed(product.id)
                        ? 'bg-green-100 text-green-700 border-green-600 cursor-default'
                        : canRedeem(product.points)
                        ? `bg-gradient-to-r ${product.color} text-white hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5`
                        : 'text-secondary border-secondary cursor-not-allowed opacity-50'
                    }`}
                    style={
                      isRedeemed(product.id)
                        ? { boxShadow: '3px 3px 0px 0px rgba(22,163,74,0.3)' }
                        : canRedeem(product.points)
                        ? {
                            borderColor: 'var(--border-primary)',
                            boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.4)'
                          }
                        : { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }
                    }
                  >
                    {/* Shine sweep on hover */}
                    {canRedeem(product.points) && !isRedeemed(product.id) && (
                      <span className="absolute inset-0 -left-full group-hover:left-full transition-all duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    )}
                    <FiShoppingCart size={16} className="relative z-10" />
                    <span className="relative z-10">
                      {isRedeemed(product.id) ? 'Redeemed' : 'Redeem Now'}
                    </span>
                  </button>
                </div>

                {/* Bottom-left corner slice */}
                <div
                  className="absolute bottom-0 left-0 w-6 h-6 border-r-[4px] border-t-[4px] rounded-tr-lg z-[1]"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-primary)'
                  }}
                />

                {/* Accent diamond shape */}
                <div
                  className={`absolute w-10 h-10 bg-gradient-to-br ${product.color} border-[3px] rounded-md rotate-45 -bottom-5 right-8 transition-transform group-hover:rotate-[55deg] group-hover:scale-110`}
                  style={{ borderColor: 'var(--border-primary)' }}
                />

                {/* Approval stamp */}
                <div
                  className="absolute bottom-6 left-6 w-16 h-16 flex items-center justify-center border-[3px] rounded-full opacity-20 z-[1]"
                  style={{ borderColor: 'var(--border-primary)', transform: 'rotate(-15deg)' }}
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-tight text-primary">Approved</span>
                </div>

                {/* Dot pattern */}
                <svg
                  className="absolute -bottom-4 -left-8 w-32 h-16 opacity-30 -rotate-12 pointer-events-none z-[1] text-primary"
                  viewBox="0 0 80 40"
                >
                  <circle fill="currentColor" r={3} cy={10} cx={10} />
                  <circle fill="currentColor" r={3} cy={10} cx={30} />
                  <circle fill="currentColor" r={3} cy={10} cx={50} />
                  <circle fill="currentColor" r={3} cy={10} cx={70} />
                  <circle fill="currentColor" r={3} cy={20} cx={20} />
                  <circle fill="currentColor" r={3} cy={20} cx={40} />
                  <circle fill="currentColor" r={3} cy={20} cx={60} />
                  <circle fill="currentColor" r={3} cy={30} cx={10} />
                  <circle fill="currentColor" r={3} cy={30} cx={30} />
                  <circle fill="currentColor" r={3} cy={30} cx={50} />
                  <circle fill="currentColor" r={3} cy={30} cx={70} />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Orders Section */}
      {myOrders.length > 0 && (
        <div ref={ordersRef} className="max-w-7xl mx-auto px-8 pb-12">
          <h2
            className="text-3xl font-extrabold uppercase tracking-wide mb-6 pb-4 border-b-[4px]"
            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
          >
            My Orders
          </h2>

          <div className="flex flex-col gap-6">
            {myOrders.map((order) => {
              const currentIdx = getStatusIndex(order.status);
              return (
                <div
                  key={order._id}
                  className="rounded-xl border-[4px] overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-primary)',
                    boxShadow: '6px 6px 0px 0px rgba(0,0,0,0.4)'
                  }}
                >
                  {/* Order header */}
                  <div
                    className="flex items-center justify-between px-6 py-4 border-b-[3px]"
                    style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div>
                      <p className="font-extrabold text-lg uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                        {order.productName}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiStar className="text-yellow-400" size={18} />
                      <span className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                        {order.pointsSpent.toLocaleString()} pts
                      </span>
                    </div>
                  </div>

                  <div className="px-6 py-5 space-y-5">
                    {/* Status timeline */}
                    {order.status === 'cancelled' ? (
                      <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-[3px] font-extrabold uppercase text-sm"
                        style={{ borderColor: '#dc2626', color: '#dc2626', backgroundColor: '#fef2f2' }}
                      >
                        Order Cancelled
                      </div>
                    ) : (
                      <div className="flex items-center gap-0">
                        {STATUS_STEPS.map((step, idx) => {
                          const reached = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;
                          return (
                            <div key={step.key} className="flex items-center flex-1 last:flex-none">
                              {/* Circle */}
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <div
                                  className="w-8 h-8 rounded-full border-[3px] flex items-center justify-center transition-all"
                                  style={{
                                    borderColor: reached ? 'var(--text-brand, #6366f1)' : 'var(--border-primary)',
                                    backgroundColor: reached ? 'var(--text-brand, #6366f1)' : 'var(--bg-secondary)',
                                    boxShadow: isCurrent ? '0 0 0 3px rgba(99,102,241,0.25)' : 'none'
                                  }}
                                >
                                  {reached && <FiCheck size={14} className="text-white font-bold" />}
                                </div>
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wide text-center leading-tight max-w-[60px]"
                                  style={{ color: reached ? 'var(--text-brand, #6366f1)' : 'var(--text-secondary)' }}
                                >
                                  {step.label}
                                </span>
                              </div>

                              {/* Connector line (not after last) */}
                              {idx < STATUS_STEPS.length - 1 && (
                                <div
                                  className="flex-1 h-[3px] mx-1 rounded-full transition-all"
                                  style={{
                                    backgroundColor: idx < currentIdx ? 'var(--text-brand, #6366f1)' : 'var(--border-primary)'
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Status history (most recent first) */}
                    {order.statusHistory && order.statusHistory.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {[...order.statusHistory].reverse().map((entry, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div
                              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: i === 0 ? 'var(--text-brand, #6366f1)' : 'var(--border-primary)' }}
                            />
                            <div>
                              <span
                                className="text-xs font-bold uppercase"
                                style={{ color: i === 0 ? 'var(--text-brand, #6366f1)' : 'var(--text-secondary)' }}
                              >
                                {entry.status.replace(/_/g, ' ')}
                              </span>
                              {entry.note && (
                                <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                                  — {entry.note}
                                </span>
                              )}
                              <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                                {new Date(entry.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal — Multi-step BRUTALIST style */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="max-w-md w-full rounded-2xl overflow-hidden animate-in fade-in scale-95 duration-200 border-[6px] relative max-h-[90vh] flex flex-col"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-primary)',
              boxShadow: '12px 12px 0px 0px rgba(0,0,0,0.4)'
            }}
          >
            {/* Top corner accent */}
            <div className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br ${selectedProduct.color} rotate-45 z-10 pointer-events-none`} />
            <div className="absolute top-4 right-4 text-2xl font-bold z-20 text-primary pointer-events-none">★</div>

            {/* ── STEP: CONFIRM ── */}
            {modalStep === 'confirm' && (
              <>
                {/* Product image area */}
                <div
                  className={`relative h-64 bg-gradient-to-br ${selectedProduct.color} border-b-[6px] flex items-center justify-center p-6 flex-shrink-0`}
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="h-full w-full object-contain drop-shadow-2xl"
                  />
                </div>

                <div className="p-8 space-y-6 relative overflow-y-auto">
                  {/* Title */}
                  <div>
                    <h2 className="text-3xl font-extrabold mb-2 text-primary uppercase tracking-wide">
                      {selectedProduct.name}
                    </h2>
                    <p className="text-secondary font-semibold">
                      {selectedProduct.description}
                    </p>
                  </div>

                  {/* Points required */}
                  <div
                    className="flex items-center justify-between p-5 rounded-xl border-[4px]"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-primary)',
                      boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.4)'
                    }}
                  >
                    <span className="font-extrabold text-secondary uppercase text-sm">
                      Points Required:
                    </span>
                    <div className="flex items-center gap-2">
                      <FiStar className="text-yellow-400" size={24} />
                      <span className="text-3xl font-extrabold text-primary">
                        {selectedProduct.points.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Affordability indicator */}
                  <div
                    className={`p-5 rounded-xl border-[4px] ${
                      userPoints >= selectedProduct.points
                        ? 'bg-green-100 border-green-600'
                        : 'bg-red-100 border-red-600'
                    }`}
                  >
                    <p
                      className={`text-sm font-extrabold uppercase ${
                        userPoints >= selectedProduct.points ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {userPoints >= selectedProduct.points
                        ? `✓ You have enough! ${(userPoints - selectedProduct.points).toLocaleString()} points remaining`
                        : `✗ Need ${(selectedProduct.points - userPoints).toLocaleString()} more points`}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={closeModal}
                      className="flex-1 py-3 font-extrabold rounded-xl border-[4px] uppercase tracking-wide transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 text-primary"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-primary)',
                        boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.4)'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmClick}
                      disabled={!canRedeem(selectedProduct.points) || isRedeemed(selectedProduct.id) || addressLoading}
                      className={`flex-1 py-3 rounded-xl font-extrabold transition-all duration-200 flex items-center justify-center gap-2 uppercase tracking-wide border-[4px] ${
                        canRedeem(selectedProduct.points) && !isRedeemed(selectedProduct.id) && !addressLoading
                          ? `bg-gradient-to-r ${selectedProduct.color} text-white hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5`
                          : 'text-secondary cursor-not-allowed opacity-50'
                      }`}
                      style={
                        canRedeem(selectedProduct.points) && !isRedeemed(selectedProduct.id)
                          ? {
                              borderColor: 'var(--border-primary)',
                              boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.4)'
                            }
                          : { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }
                      }
                    >
                      {addressLoading ? (
                        <>
                          <FiLoader size={18} className="animate-spin" />
                          Loading…
                        </>
                      ) : (
                        <>
                          <FiShoppingCart size={18} />
                          {isRedeemed(selectedProduct.id) ? 'Redeemed' : 'Confirm'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP: ADDRESS ── */}
            {modalStep === 'address' && (
              <div className="p-8 space-y-5 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-extrabold uppercase tracking-wide text-primary">
                    Delivery Address
                  </h2>
                  {!addressEditable && (
                    <button
                      onClick={() => setAddressEditable(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-[3px] font-bold text-sm uppercase tracking-wide transition-all hover:-translate-y-0.5"
                      style={{
                        borderColor: 'var(--border-primary)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        boxShadow: '3px 3px 0px 0px rgba(0,0,0,0.3)'
                      }}
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </button>
                  )}
                </div>

                {/* Address form */}
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'Full Name', key: 'fullName', placeholder: 'John Doe' },
                    { label: 'Phone Number', key: 'phone', placeholder: '+91 98765 43210' },
                    { label: 'Street / House No.', key: 'street', placeholder: '42, MG Road' },
                    { label: 'City', key: 'city', placeholder: 'Bengaluru' },
                    { label: 'State', key: 'state', placeholder: 'Karnataka' },
                    { label: 'Pincode', key: 'pincode', placeholder: '560001' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label
                        className="block text-xs font-extrabold uppercase tracking-wide mb-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {label}
                      </label>
                      <input
                        type="text"
                        value={address[key as keyof Address]}
                        onChange={(e) =>
                          setAddress((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={placeholder}
                        disabled={!addressEditable}
                        className="w-full px-4 py-2.5 rounded-lg border-[3px] font-semibold text-sm outline-none transition-all"
                        style={{
                          backgroundColor: addressEditable ? 'var(--bg-secondary)' : 'var(--bg-elevated)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)',
                          opacity: addressEditable ? 1 : 0.8,
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Error */}
                {redeemError && (
                  <div className="p-4 rounded-xl border-[3px] border-red-600 bg-red-100">
                    <p className="text-sm font-bold text-red-700 uppercase">{redeemError}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => {
                      setModalStep('confirm');
                      setRedeemError(null);
                    }}
                    className="flex-1 py-3 font-extrabold rounded-xl border-[4px] uppercase tracking-wide transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 text-primary"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-primary)',
                      boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.4)'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={redeemLoading || !address.fullName || !address.phone || !address.street || !address.city || !address.state || !address.pincode}
                    className={`flex-1 py-3 rounded-xl font-extrabold transition-all duration-200 flex items-center justify-center gap-2 uppercase tracking-wide border-[4px] ${
                      !redeemLoading && address.fullName && address.phone && address.street && address.city && address.state && address.pincode
                        ? `bg-gradient-to-r ${selectedProduct.color} text-white hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5`
                        : 'text-secondary cursor-not-allowed opacity-50'
                    }`}
                    style={
                      !redeemLoading && address.fullName
                        ? {
                            borderColor: 'var(--border-primary)',
                            boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.4)'
                          }
                        : { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }
                    }
                  >
                    {redeemLoading ? (
                      <>
                        <FiLoader size={18} className="animate-spin" />
                        Placing…
                      </>
                    ) : (
                      <>
                        <FiShoppingCart size={18} />
                        Place Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: SUCCESS ── */}
            {modalStep === 'success' && (
              <div className="p-10 flex flex-col items-center text-center space-y-6">
                {/* Green checkmark */}
                <div
                  className="w-24 h-24 rounded-full border-[5px] border-green-600 bg-green-100 flex items-center justify-center"
                  style={{ boxShadow: '6px 6px 0px 0px rgba(22,163,74,0.3)' }}
                >
                  <FiCheck size={48} className="text-green-600" strokeWidth={3} />
                </div>

                <div>
                  <h2 className="text-3xl font-extrabold uppercase tracking-wide mb-2" style={{ color: 'var(--text-primary)' }}>
                    Order Placed!
                  </h2>
                  <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Your <span className="font-extrabold" style={{ color: 'var(--text-primary)' }}>{selectedProduct.name}</span> is on its way.
                    We&apos;ll notify you as your order progresses.
                  </p>
                </div>

                <button
                  onClick={scrollToOrders}
                  className={`w-full py-3 rounded-xl font-extrabold transition-all duration-200 flex items-center justify-center gap-2 uppercase tracking-wide border-[4px] bg-gradient-to-r ${selectedProduct.color} text-white hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5`}
                  style={{
                    borderColor: 'var(--border-primary)',
                    boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.4)'
                  }}
                >
                  View My Orders
                </button>

                <button
                  onClick={closeModal}
                  className="text-sm font-bold uppercase tracking-wide underline underline-offset-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
