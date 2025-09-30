import React, { useContext, useEffect, useState, useCallback } from "react";
import { Button } from "@mui/material";
import { BsFillBagCheckFill } from "react-icons/bs";
import { MyContext } from '../../App';
import { FaPlus } from "react-icons/fa6";
import Radio from '@mui/material/Radio';
import { deleteData, fetchDataFromApi, postData } from "../../utils/api";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';

const VITE_APP_RAZORPAY_KEY_ID = import.meta.env.VITE_APP_RAZORPAY_KEY_ID;
const VITE_APP_PAYPAL_CLIENT_ID = import.meta.env.VITE_APP_PAYPAL_CLIENT_ID;
const VITE_API_URL = import.meta.env.VITE_API_URL;

const Checkout = () => {
  const [userData, setUserData] = useState(null);
  const [isChecked, setIsChecked] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsloading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const context = useContext(MyContext);
  const history = useNavigate();

  // Function to load Razorpay script
  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setRazorpayLoaded(true);
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setUserData(context?.userData);
    setSelectedAddress(context?.userData?.address_details[0]?._id);
    loadRazorpayScript();
  }, [context?.userData, loadRazorpayScript]);

  useEffect(() => {
    const calculateTotal = () => {
      if (!context.cartData || context.cartData.length === 0) return 0;
      
      return context.cartData.reduce((total, item) => {
        return total + (Number(item.price) * Number(item.quantity));
      }, 0);
    };

    setTotalAmount(calculateTotal());
  }, [context.cartData]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${VITE_APP_PAYPAL_CLIENT_ID}&disable-funding=card`;
    script.async = true;
    script.onload = () => {
      window.paypal
        .Buttons({
          createOrder: async () => {
            const resp = await fetch(
              "https://v6.exchangerate-api.com/v6/8f85eea95dae9336b9ea3ce9/latest/INR"
            );

            const respData = await resp.json();
            let convertedAmount = 0;

            if (respData.result === "success") {
              const inrToUsdRate = 1 / respData.conversion_rates.USD;
              convertedAmount = (totalAmount * inrToUsdRate).toFixed(2);
            }

            const headers = {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json',
            }

            const response = await axios.get(
              `${VITE_API_URL}/api/order/create-order-paypal?userId=${context?.userData?._id}&totalAmount=${convertedAmount}`,
              { headers }
            );

            return response?.data?.id;
          },
          onApprove: async (data) => {
            onApprovePayment(data);
          },
          onError: (err) => {
            history("/order/failed");
            console.error("PayPal Checkout onError:", err);
          },
        })
        .render("#paypal-button-container");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [context?.cartData, context?.userData, selectedAddress, totalAmount, history]);

  const onApprovePayment = async (data) => {
    const user = context?.userData;

    const info = {
      userId: user?._id,
      products: context?.cartData,
      payment_status: "COMPLETE",
      delivery_address: selectedAddress,
      totalAmount: totalAmount,
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    };

    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    }

    await axios.post(
      `${VITE_API_URL}/api/order/capture-order-paypal`,
      {
        ...info,
        paymentId: data.orderID
      }, { headers }
    ).then((res) => {
      context.alertBox("success", res?.data?.message);
      history("/order/success");
      deleteData(`/api/cart/emptyCart/${context?.userData?._id}`).then((res) => {
        context?.getCartItems();
      })
    });
  }

  const editAddress = (id) => {
    context?.setOpenAddressPanel(true);
    context?.setAddressMode("edit");
    context?.setAddressId(id);
  }

  const handleChange = (e, index) => {
    if (e.target.checked) {
      setIsChecked(index);
      setSelectedAddress(e.target.value)
    }
  }

  const checkout = async (e) => {
    e.preventDefault();

    if (!razorpayLoaded) {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        context.alertBox("error", "Failed to load payment processor");
        return;
      }
    }

    if (userData?.address_details?.length === 0) {
      context.alertBox("error", "Please add address");
      return;
    }

    if (totalAmount <= 0) {
      context.alertBox("error", "Invalid order amount");
      return;
    }

    const options = {
      key: VITE_APP_RAZORPAY_KEY_ID,
      amount: Math.round(totalAmount * 100), // Convert to paise
      currency: "INR",
      name: "Your Store Name",
      description: "Order Payment",
      order_receipt: context?.userData?.name,
      handler: function (response) {
        const paymentId = response.razorpay_payment_id;
        const user = context?.userData;

        const payLoad = {
          userId: user?._id,
          products: context?.cartData,
          paymentId: paymentId,
          payment_status: "COMPLETED",
          delivery_address: selectedAddress,
          totalAmt: totalAmount,
          date: new Date().toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        };

        postData(`/api/order/create`, payLoad).then((res) => {
          context.alertBox("success", res?.message);
          if (res?.error === false) {
            deleteData(`/api/cart/emptyCart/${user?._id}`).then((res) => {
              context?.getCartItems();
            })
            history("/order/success");
          } else {
            history("/order/failed");
            context.alertBox("error", res?.message);
          }
        });
      },
      theme: {
        color: "#800000",
      },
    };

    const pay = new window.Razorpay(options);
    pay.open();
  }

  const cashOnDelivery = () => {
    const user = context?.userData;
    setIsloading(true);

    if (userData?.address_details?.length === 0) {
      context.alertBox("error", "Please add address");
      setIsloading(false);
      return;
    }

    const payLoad = {
      userId: user?._id,
      products: context?.cartData,
      paymentId: '',
      payment_status: "CASH ON DELIVERY",
      delivery_address: selectedAddress,
      totalAmt: totalAmount,
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    };

    postData(`/api/order/create`, payLoad).then((res) => {
      context.alertBox("success", res?.message);

      if (res?.error === false) {
        deleteData(`/api/cart/emptyCart/${user?._id}`).then(() => {
          context?.getCartItems();
          setIsloading(false);
          history("/order/success");
        });
      } else {
        context.alertBox("error", res?.message);
        setIsloading(false);
      }
    });
  }

  return (
    <section className="py-3 lg:py-10 px-3">
      <form onSubmit={checkout}>
        <div className="w-full lg:w-[70%] m-auto flex flex-col md:flex-row gap-5">
          <div className="leftCol w-full md:w-[60%]">
            <div className="card bg-white shadow-md p-5 rounded-md w-full">
              <div className="flex items-center justify-between">
                <h2>Select Delivery Address</h2>
                {userData?.address_details?.length !== 0 && (
                  <Button variant="outlined"
                    onClick={() => {
                      context?.setOpenAddressPanel(true);
                      context?.setAddressMode("add");
                    }} className="btn">
                    <FaPlus />
                    ADD {context?.windowWidth < 767 ? '' : 'NEW ADDRESS'}
                  </Button>
                )}
              </div>

              <br />

              <div className="flex flex-col gap-4">
                {userData?.address_details?.length !== 0 ? (
                  userData?.address_details?.map((address, index) => (
                    <label className={`flex gap-3 p-4 border border-[rgba(0,0,0,0.1)] rounded-md relative ${isChecked === index && 'bg-[#fff2f2]'}`} key={index}>
                      <div>
                        <Radio size="small" onChange={(e) => handleChange(e, index)}
                          checked={isChecked === index} value={address?._id} />
                      </div>
                      <div className="info">
                        <span className="inline-block text-[13px] font-[500] p-1 bg-[#f1f1f1] rounded-md">{address?.addressType}</span>
                        <h3>{userData?.name}</h3>
                        <p className="mt-0 mb-0">
                          {`${address?.address_line1}, ${address?.city}, ${address?.state}, ${address?.country} - ${address?.pincode}`}
                        </p>
                        <p className="mb-0 font-[500]">+{userData?.mobile || address?.mobile}</p>
                      </div>
                      <Button variant="text" className="!absolute top-[15px] right-[15px]" size="small"
                        onClick={() => editAddress(address?._id)}>
                        EDIT
                      </Button>
                    </label>
                  ))
                ) : (
                  <div className="flex items-center mt-5 justify-between flex-col p-5">
                    <img src="/map.png" width="100" alt="Address" />
                    <h2 className="text-center">No Addresses found in your account!</h2>
                    <p className="mt-0">Add a delivery address.</p>
                    <Button className="btn-org" 
                      onClick={() => {
                        context?.setOpenAddressPanel(true);
                        context?.setAddressMode("add");
                      }}>
                      ADD ADDRESS
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rightCol w-full md:w-[40%]">
            <div className="card shadow-md bg-white p-5 rounded-md">
              <h2 className="mb-4">Your Order</h2>

              <div className="flex items-center justify-between py-3 border-t border-b border-[rgba(0,0,0,0.1)]">
                <span className="text-[14px] font-[600]">Product</span>
                <span className="text-[14px] font-[600]">Subtotal</span>
              </div>

              <div className="mb-5 scroll max-h-[250px] overflow-y-scroll overflow-x-hidden pr-2">
                {context?.cartData?.length !== 0 && context?.cartData?.map((item, index) => (
                  <div className="flex items-center justify-between py-2" key={index}>
                    <div className="part1 flex items-center gap-3">
                      <div className="img w-[50px] h-[50px] object-cover overflow-hidden rounded-md group cursor-pointer">
                        <img
                          src={item?.image}
                          className="w-full transition-all group-hover:scale-105"
                          alt={item?.productTitle}
                        />
                      </div>
                      <div className="info">
                        <h4 className="text-[14px]" title={item?.productTitle}>
                          {item?.productTitle?.substr(0, 20) + (item?.productTitle?.length > 20 ? '...' : '')}
                        </h4>
                        <span className="text-[13px]">Qty: {item?.quantity}</span>
                      </div>
                    </div>
                    <span className="text-[14px] font-[500]">
                      {(item?.quantity * item?.price)?.toLocaleString('en-US', { 
                        style: 'currency', 
                        currency: 'INR' 
                      })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[rgba(0,0,0,0.1)] py-3">
                <div className="flex justify-between font-[600]">
                  <span>Total:</span>
                  <span>
                    {totalAmount?.toLocaleString('en-US', { 
                      style: 'currency', 
                      currency: 'INR' 
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center flex-col gap-3 mb-2 mt-4">
                <Button type="submit" className="btn-org btn-lg w-full flex gap-2 items-center">
                  <BsFillBagCheckFill className="text-[20px]" /> Checkout
                </Button>

                <div id="paypal-button-container" className={`${userData?.address_details?.length === 0 ? 'pointer-events-none' : ''}`}></div>

                <Button type="button" className="btn-dark btn-lg w-full flex gap-2 items-center" onClick={cashOnDelivery}>
                  {isLoading ? <CircularProgress size={24} /> : (
                    <>
                      <BsFillBagCheckFill className="text-[20px]" />
                      Cash on Delivery
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

export default Checkout;