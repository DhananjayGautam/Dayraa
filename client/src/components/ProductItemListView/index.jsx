import React,{useContext,useEffect, useState } from "react";
import "../ProductItem/style.css";
import { Link } from "react-router-dom";
import Rating from "@mui/material/Rating";
import Button from "@mui/material/Button";
import { FaRegHeart } from "react-icons/fa";
import { IoGitCompareOutline } from "react-icons/io5";
import { MdZoomOutMap } from "react-icons/md";
import { MyContext } from "../../App";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaMinus } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { deleteData, editData, postData } from "../../utils/api";
import CircularProgress from '@mui/material/CircularProgress';
import { MdClose } from "react-icons/md";
import { IoMdHeart } from "react-icons/io";

const ProductItem = (props) => {

    const [quantity, setQuantity] = useState(1);
    const [isAdded, setIsAdded] = useState(false);
    const [isAddedInMyList, setIsAddedInMyList] = useState(false);
    const [cartItem, setCartItem] = useState([]);
  
    const [activeTab, setActiveTab] = useState(null);
    const [isShowTabs, setIsShowTabs] = useState(false);
    const [selectedTabName, setSelectedTabName] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
  
  
    const context = useContext(MyContext);
  
    const addToCart = (product, userId, quantity) => {
      // Check stock availability before adding to cart
      if (quantity > product?.countInStock) {
        context?.alertBox("error", `Only ${product?.countInStock} items available in stock`);
        return;
      }
  
      const productItem = {
        _id: product?._id,
        name: product?.name,
        image: product?.images[0],
        rating: product?.rating,
        price: product?.price,
        oldPrice: product?.oldPrice,
        discount: product?.discount,
        quantity: quantity,
        subTotal: parseInt(product?.price * quantity),
        productId: product?._id,
        countInStock: product?.countInStock,
        brand: product?.brand,
        size: props?.item?.size?.length !== 0 ? selectedTabName : '',
        weight: props?.item?.productWeight?.length !== 0 ? selectedTabName : '',
        ram: props?.item?.productRam?.length !== 0 ? selectedTabName : ''
      }
  
      setIsLoading(true);
  
      if (props?.item?.size?.length !== 0 || props?.item?.productRam?.length !== 0 || props?.item?.productWeight
        ?.length !== 0) {
        setIsShowTabs(true)
      } else {
        setIsAdded(true);
  
        setIsShowTabs(false);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
        context?.addToCart(productItem, userId, quantity);
      }
  
      if (activeTab !== null) {
        context?.addToCart(productItem, userId, quantity);
        setIsAdded(true);
        setIsShowTabs(false)
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }
  
    const handleClickActiveTab = (index, name) => {
      setActiveTab(index)
      setSelectedTabName(name)
    }
  
    useEffect(() => {
      const item = context?.cartData?.filter((cartItem) =>
        cartItem.productId.includes(props?.item?._id)
      )
  
      const myListItem = context?.myListData?.filter((item) =>
        item.productId.includes(props?.item?._id)
      )
  
      if (item?.length !== 0) {
        setCartItem(item)
        setIsAdded(true);
        setQuantity(item[0]?.quantity)
      } else {
        setQuantity(1)
      }
  
      if (myListItem?.length !== 0) {
        setIsAddedInMyList(true);
      } else {
        setIsAddedInMyList(false)
      }
  
    }, [context?.cartData]);
  
    const minusQty = () => {
      if (quantity !== 1 && quantity > 1) {
        setQuantity(quantity - 1)
      } else {
        setQuantity(1)
      }
  
      if (quantity === 1) {
        deleteData(`/api/cart/delete-cart-item/${cartItem[0]?._id}`).then((res) => {
          setIsAdded(false);
          context.alertBox("success", "Item Removed ");
          context?.getCartItems();
          setIsShowTabs(false);
          setActiveTab(null);
        })
      } else {
        const obj = {
          _id: cartItem[0]?._id,
          qty: quantity - 1,
          subTotal: props?.item?.price * (quantity - 1)
        }
  
        editData(`/api/cart/update-qty`, obj).then((res) => {
          context.alertBox("success", res?.data?.message);
          context?.getCartItems();
        })
      }
    }
  
    const addQty = () => {
      // Check if we can add more quantity based on available stock
      if (props?.item?.countInStock <= quantity) {
        context?.alertBox("error", `Only ${props?.item?.countInStock} items available in stock`);
        return;
      }
  
      setQuantity(quantity + 1);
  
      const obj = {
        _id: cartItem[0]?._id,
        qty: quantity + 1,
        subTotal: props?.item?.price * (quantity + 1)
      }
  
      editData(`/api/cart/update-qty`, obj).then((res) => {
        context.alertBox("success", res?.data?.message);
        context?.getCartItems();
      })
    }
  
    const handleAddToMyList = (item) => {
      if (context?.userData === null) {
        context?.alertBox("error", "you are not login please login first");
        return false
      }
  
      else {
        const obj = {
          productId: item?._id,
          userId: context?.userData?._id,
          productTitle: item?.name,
          image: item?.images[0],
          rating: item?.rating,
          price: item?.price,
          oldPrice: item?.oldPrice,
          brand: item?.brand,
          discount: item?.discount
        }
  
        postData("/api/myList/add", obj).then((res) => {
          if (res?.error === false) {
            context?.alertBox("success", res?.message);
            setIsAddedInMyList(true);
            context?.getMyListData();
          } else {
            context?.alertBox("error", res?.message);
          }
        })
      }
    }

    // Check if product is out of stock
    const isOutOfStock = props?.item?.countInStock === 0;
    // Check if we can add more to cart (for the plus button)
    const canAddMore = props?.item?.countInStock > quantity;

  return (
    <div className="productItem p-4 shadow-md bg-[#f1f1f1] rounded-md overflow-hidden border-1 border-[rgba(0,0,0,0.1)] flex items-center flex-col lg:flex-row">
      <div className="group imgWrapper w-full lg:w-[25%]  overflow-hidden  rounded-md relative">
        <Link to={`/product/${props?.item?._id}`}>
          <div className="img  overflow-hidden">
            <img
              src={props?.item?.images[0]}
              className="w-full"
            />

            <img
              src={props?.item?.images[1]}
              className="w-full transition-all duration-700 absolute top-0 left-0 opacity-0 group-hover:opacity-100 group-hover:scale-105"
            />
          </div>
        </Link>

          {
          isShowTabs === true &&
          <div className="flex items-center justify-center absolute top-0 left-0 w-full h-full 
      bg-[rgba(0,0,0,0.7)] z-[60] p-3 gap-2">

            <Button className="!absolute top-[10px] right-[10px] !min-w-[30px] !min-h-[30px] !w-[30px] !h-[30px] !rounded-full !bg-[rgba(255,255,255,1)] text-black"
              onClick={() => setIsShowTabs(false)}
            > <MdClose className=" text-black z-[90] text-[25px]" /></Button>

            {
              props?.item?.size?.length !== 0 && props?.item?.size?.map((item, index) => {
                return (
                  <span key={index} className={`flex items-center justify-center p-1 px-2 bg-[rgba(255,555,255,0.8)] max-w-[35px] h-[25px]  
          rounded-sm cursor-pointer hover:bg-white 
          ${activeTab === index && '!bg-primary text-white'}`}
                    onClick={() => handleClickActiveTab(index, item)}
                  >{item}
                  </span>)
              })
            }

            {
              props?.item?.productRam?.length !== 0 && props?.item?.productRam?.map((item, index) => {
                return (
                  <span key={index} className={`flex items-center justify-center p-1 px-2 bg-[rgba(255,555,255,0.8)] max-w-[45px] h-[25px]  
          rounded-sm cursor-pointer hover:bg-white 
          ${activeTab === index && '!bg-primary text-white'}`}
                    onClick={() => handleClickActiveTab(index, item)}
                  >{item}
                  </span>)
              })
            }


            {
              props?.item?.productWeight?.length !== 0 && props?.item?.productWeight?.map((item, index) => {
                return (
                  <span key={index} className={`flex items-center justify-center p-1 px-2 bg-[rgba(255,555,255,0.8)] max-w-[35px] h-[25px]  
          rounded-sm cursor-pointer hover:bg-white 
          ${activeTab === index && '!bg-primary text-white'}`}
                    onClick={() => handleClickActiveTab(index, item)}
                  >{item}
                  </span>)
              })
            }

          </div>
        }


        <span className="discount flex items-center absolute top-[10px] left-[10px] z-50 bg-primary text-white rounded-lg p-1 text-[12px] font-[500]">
          {props?.item?.discount}%
        </span>

        {/* Show out of stock badge */}
        {isOutOfStock && (
          <span className="flex items-center absolute top-[10px] right-[10px] z-50 bg-red-500 text-white rounded-lg p-1 text-[12px] font-[500]">
            Out of Stock
          </span>
        )}

        <div className="actions absolute top-[-20px] right-[5px] z-50 flex items-center gap-2 flex-col w-[50px] transition-all duration-300 group-hover:top-[15px] opacity-0 group-hover:opacity-100">

          <Button className="!w-[35px] !h-[35px] !min-w-[35px] !rounded-full !bg-white  text-black hover:!bg-primary hover:text-white group" onClick={() => context.handleOpenProductDetailsModal(true, props?.item)}>
            <MdZoomOutMap className="text-[18px] !text-black group-hover:text-white hover:!text-white" />
          </Button>

          <Button className="!w-[35px] !h-[35px] !min-w-[35px] !rounded-full !bg-white  text-black hover:!bg-primary hover:text-white group">
            <IoGitCompareOutline className="text-[18px] !text-black group-hover:text-white hover:!text-white" />
          </Button>

          <Button className={`!w-[35px] !h-[35px] !min-w-[35px] !rounded-full !bg-white  text-black hover:!bg-primary hover:text-white group`}
            onClick={() => handleAddToMyList(props?.item)}
          >
            {
              isAddedInMyList === true ? <IoMdHeart  className="text-[18px] !text-primary group-hover:text-white hover:!text-white"/> :
                <FaRegHeart className="text-[18px] !text-black group-hover:text-white hover:!text-white" />

            }

          </Button>
        </div>
      </div>

      <div className="info p-3 py-5 pb-0 px-3 lg:px-8  w-full lg:w-[75%]">
        <h6 className="text-[15px] !font-[400]">
          <Link to="/" className="link transition-all">
           {props?.item?.brand}
          </Link>
        </h6>
        <h3 className="text-[18px] title mt-3 font-[500] mb-1 text-[#000]" style={{lineHeight:'25px'}}>
          <Link to={`/product/${props?.item?._id}`} className="link transition-all">
           {props?.item?.name}
          </Link>
        </h3>

        <p className="text-[14px] mb-3">
         {props?.item?.description}
        </p>

        <Rating name="size-small" value={props?.item?.rating} size="small" readOnly />

        {/* Stock information */}
        <div className="text-[12px] text-gray-500 mt-1 mb-2">
          {isOutOfStock ? (
            <span className="text-red-500">Out of stock</span>
          ) : (
            `${props?.item?.countInStock} items in stock`
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="oldPrice line-through text-gray-500 text-[15px] font-[500]">
          &#x20b9;{props?.item?.oldPrice}
          </span>
          <span className="price text-primary text-[15px]  font-[600]">
            &#x20b9;{props?.item?.price}
          </span>
        </div>

        <div className="mt-3 w-[180px]">
         {
            isAdded === false ?

              <Button 
                className={`btn-org btn-border flex w-full btn-sm gap-2 ${isOutOfStock ? '!bg-gray-400 !cursor-not-allowed' : ''}`} 
                size="small"
                onClick={() => !isOutOfStock && addToCart(props?.item, context?.userData?._id, quantity)}
                disabled={isOutOfStock}
              >
                <MdOutlineShoppingCart className="text-[18px]" /> 
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>

              :

              <>
                {
                  isLoading === true ?
                    <Button className="addtocart btn-org btn-border flex w-full btn-sm gap-2 " size="small">
                      <CircularProgress />
                    </Button>

                    :


                    <div className="flex items-center justify-between overflow-hidden rounded-full border border-[rgba(0,0,0,0.1)]">
                      <Button className="!min-w-[35px] !w-[35px] !h-[30px] !bg-[#f1f1f1]  !rounded-none" onClick={minusQty}><FaMinus className="text-[rgba(0,0,0,0.7)]" /></Button>
                      <span>{quantity}</span>
                      <Button 
                        className={`!min-w-[35px] !w-[35px] !h-[30px] !rounded-none ${canAddMore ? '!bg-primary' : '!bg-gray-400 !cursor-not-allowed'}`}
                        onClick={canAddMore ? addQty : null}
                        disabled={!canAddMore}
                      >
                        <FaPlus className="text-white" />
                      </Button>
                    </div>

                }
              </>

          }
        </div>
      </div>
    </div>
  );
};

export default ProductItem;