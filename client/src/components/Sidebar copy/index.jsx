import React, { useContext, useEffect, useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import "../Sidebar/style.css";
import { Collapse } from "react-collapse";
import { FaAngleDown } from "react-icons/fa6";
import Button from "@mui/material/Button";
import { FaAngleUp } from "react-icons/fa6";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";
import Rating from "@mui/material/Rating";
import { MyContext } from "../../App";
import { fetchDataFromApi, postData } from "../../utils/api";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';


export const Sidebar = (props) => {
  const [isOpenCategoryFilter, setIsOpenCategoryFilter] = useState(true);
  const [isOpenAvailFilter, setisOpenAvailFilter] = useState(true);
  const [isOpenSizeFilter, setisOpenSizeFilter] = useState(true);

  const [price, setPrice] = useState([100, 100000]);
  const [currentCat, setCurrentCat] = useState("");
  const [currentSubCat, setCurrentSubCat] = useState("");

  const [isOpenRamsFilter, setisOpenRamsFilter] = useState(true);
  const [isOpenWeightFilter, setisOpenWeightFilter] = useState(true);

  const [isShowSizeFilter, setIsShowSizeFilter] = useState(false);
  const [productSizeData, setProductSizeData] = useState([]);

  const [isShowRamsFilter, setIsShowRamsFilter] = useState(false);
  const [productRamsData, setProductRamsData] = useState([]);

  const [isShowWeightFilter, setIsShowWeightFilter] = useState(false);
  const [productWeightData, setProductWeightData] = useState([]);

  const [catData, setCatData] = useState([]);
  const [sortedCatIds, setSortedCatIds] = useState([]);

  const context = useContext(MyContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation()

  const [filters, setFilters] = useState({
    catId: [],
    subCatId: [],
    productRam: [],
    size: [],
    productWeight: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
  });


  useEffect(() => {

    if (context?.catData?.length !== 0) {
      setTimeout(() => {
        setCatData(context?.catData);
      }, 300);
    }

    let url = window.location.href;
    const queryParameters = new URLSearchParams(location.search);

    var catArr = [];

    if (url.includes("catId")) {
      const categoryId = queryParameters.get('catId');
      setCurrentCat(categoryId)
      setCurrentSubCat("")
      filters.subCatId=[];
      
      catArr.push(categoryId)
  
      setFilters((prev) => ({
        ...prev,
        catId: catArr
      }));
    }





    if (url.includes("subCatId")) {
      const subCatId = queryParameters.get('subCatId');
      setCurrentCat("")
      setCurrentSubCat(subCatId)

      catArr=[];
      catArr.push(subCatId)

      filters.catId=[];
  
      setFilters((prev) => ({
        ...prev,
        subCatId:catArr
      }));

     
    }
  

    


  }, [context?.catData, location])


  // useEffect(() => {

  //   const url = props?.windowUrl;

  //   const productData = props?.productData;

  //   //check if product size available

  //   const resultSize = productData?.products?.filter(
  //     (item) => item.size?.length !== 0
  //   );

  //   if (resultSize?.length !== 0) {
  //     fetchDataFromApi("/api/product/productSize/get").then((res) => {
  //       if (res?.data?.length !== 0) {

  //         setTimeout(() => {
  //           setProductSizeData(res?.data);
  //         }, 300);
  //       }

  //     })
  //     setIsShowSizeFilter(true);
  //   } else {
  //     setIsShowSizeFilter(false)
  //   }

  //   //check if product rams available

  //   const resultRams = productData?.products?.filter(
  //     (item) => item.productRam?.length !== 0
  //   );

  //   if (resultRams !== undefined && resultRams?.length !== 0) {
  //     fetchDataFromApi("/api/product/productRAMS/get").then((res) => {
  //       setProductRamsData(res?.data);
  //     })
  //     setIsShowRamsFilter(true);
  //   } else {
  //     filters.productRam = []
  //     setIsShowRamsFilter(false);
  //   }


  //   //check if product weight available

  //   const resultWeight = productData?.products?.filter(
  //     (item) => item.productWeight?.length !== 0
  //   );

  //   if (resultWeight?.length !== 0) {
  //     fetchDataFromApi("/api/product/productWeight/get").then((res) => {
  //       setProductWeightData(res?.data);
  //     })
  //     setIsShowWeightFilter(true);
  //   } else {
  //     setIsShowWeightFilter(false);
  //   }

  // }, [props?.windowUrl, props?.isLoading, props.productData]);



  const handleCheckboxChange = (e, field) => {
    const { value, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter((item) => item !== value),
    }));
  };


  useEffect(() => {
    if (filters?.catId?.length !== 0 && filters?.subCatId?.length !== 0) {
      fetchProducts();
    } else {
      filters.catId = [currentCat];
      filters.subCatId = [currentSubCat];
      props.getProducts();
    }

  }, [filters]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      minPrice: price[0],
      maxPrice: price[1]
    }));


  }, [price])

  const fetchProducts = async () => {
    try {
      props.setisLoading(true)
      postData("/api/product/filter", filters).then((res) => {
        props.setProductData(res)
        props.setisLoading(false)
      })

    } catch (error) {
      console.error("Error fetching products:", error);
      props.setisLoading(false)
    }
  };


  return (
    <aside className="sidebar py-5">
      {
        context?.catData?.length !== 0 &&
        <div className="box">
          <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
            Shop by Category
            <Button
              className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]"
              onClick={() => setIsOpenCategoryFilter(!isOpenCategoryFilter)}
            >
              {isOpenCategoryFilter === true ? <FaAngleUp /> : <FaAngleDown />}
            </Button>
          </h3>
          <Collapse isOpened={isOpenCategoryFilter}>
            <div className="scroll px-4 relative -left-[13px]">
              {
                catData?.map((cat, index) => {
                  return (
                    <FormControlLabel key={index}
                      control={<Checkbox size="small" />}
                      label={cat?.name}
                      className="w-full"
                      name="cat"
                      value={cat?._id}
                      // checked={cat.checked === true ? true : false}
                      onChange={(e) => handleCheckboxChange(e, "catId")}
                    />
                  )
                })
              }

            </div>
          </Collapse>
        </div>
      }


      <div className="box">
        <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
          Availability
          <Button
            className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]"
            onClick={() => setisOpenAvailFilter(!isOpenAvailFilter)}
          >
            {isOpenAvailFilter === true ? <FaAngleUp /> : <FaAngleDown />}
          </Button>
        </h3>
        <Collapse isOpened={isOpenAvailFilter}>
          <div className="scroll px-4 relative -left-[13px]">
            <FormControlLabel
              control={<Checkbox size="small" />}
              label="Available (17)"
              className="w-full"
            />

            <FormControlLabel
              control={<Checkbox size="small" />}
              label="In stock (10)"
              className="w-full"
            />

            <FormControlLabel
              control={<Checkbox size="small" />}
              label="Not available (17)"
              className="w-full"
            />
          </div>
        </Collapse>
      </div>

      {
        // isShowSizeFilter === true &&
        // <div className="box mt-3">
        //   <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
        //     Size
        //     <Button
        //       className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]"
        //       onClick={() => setisOpenSizeFilter(!isOpenSizeFilter)}
        //     >
        //       {isOpenSizeFilter === true ? <FaAngleUp /> : <FaAngleDown />}
        //     </Button>
        //   </h3>
        //   <Collapse isOpened={isOpenSizeFilter}>
        //     <div className="scroll px-4 relative -left-[13px]">
        //       {
        //         productSizeData?.length !== 0 && productSizeData?.map((size, index) => {
        //           return (

        //             <FormControlLabel key={index}
        //               control={<Checkbox size="small" />}
        //               label={size?.name}
        //               className="w-full"
        //               name="size"
        //               value={size?.name}
        //               // checked={cat.checked === true ? true : false}
        //               onChange={(e) => handleCheckboxChange(e, "size")}
        //             />
        //           )
        //         })
        //       }


        //     </div>
        //   </Collapse>
        // </div>
      }




      {
        // isShowRamsFilter === true &&
        // <div className="box mt-3">
        //   <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
        //     RAMS
        //     <Button
        //       className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]"
        //       onClick={() => setisOpenRamsFilter(!isOpenRamsFilter)}
        //     >
        //       {isOpenRamsFilter === true ? <FaAngleUp /> : <FaAngleDown />}
        //     </Button>
        //   </h3>
        //   <Collapse isOpened={isOpenRamsFilter}>
        //     <div className="scroll px-4 relative -left-[13px]">
        //       {
        //         productRamsData?.length !== 0 && productRamsData?.map((ram, index) => {
        //           return (
        //             <FormControlLabel key={index}
        //               control={<Checkbox size="small" />}
        //               label={ram?.name}
        //               className="w-full"
        //               value={ram?.name}
        //               name="productRam"
        //               onChange={(e) => handleCheckboxChange(e, "productRam")}
        //             />
        //           )
        //         })
        //       }

        //     </div>
        //   </Collapse>
        // </div>
      }



      {
        // isShowWeightFilter === true &&
        // <div className="box mt-3">
        //   <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
        //     WEIGHT
        //     <Button
        //       className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]"
        //       onClick={() => setisOpenWeightFilter(!isOpenWeightFilter)}
        //     >
        //       {isOpenWeightFilter === true ? <FaAngleUp /> : <FaAngleDown />}
        //     </Button>
        //   </h3>
        //   <Collapse isOpened={isOpenWeightFilter}>
        //     <div className="scroll px-4 relative -left-[13px]">
        //       <RadioGroup
        //         aria-labelledby="demo-radio-buttons-group-label"
        //         defaultValue="female"
        //         name="radio-buttons-group"
        //       >
        //         {
        //           productWeightData?.length !== 0 && productWeightData?.map((weight, index) => {
        //             return (

        //               <FormControlLabel key={index}
        //                 control={<Checkbox size="small" />}
        //                 label={weight?.name}
        //                 className="w-full"
        //                 value={weight?.name}
        //                 name="productWeight"
        //                 onChange={(e) => handleCheckboxChange(e, "productWeight")}
        //               />

        //             )
        //           })
        //         }


        //       </RadioGroup>

        //     </div>
        //   </Collapse>
        // </div>
      }


      <div className="box mt-4">
        <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
          Filter By Price
        </h3>

        <RangeSlider
          value={price}
          onInput={setPrice}
          min={100}
          max={60000}
          step={5}
        />
        <div className="flex pt-4 pb-2 priceRange">
          <span className="text-[13px]">
            From: <strong className="text-dark">Rs: {price[0]}</strong>
          </span>
          <span className="ml-auto text-[13px]">
            From: <strong className="text-dark">Rs: {price[1]}</strong>
          </span>
        </div>
      </div>

      <div className="box mt-4">
        <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5">
          Filter By Rating
        </h3>

        <div className="w-full">
          <Rating name="size-small" defaultValue={5} size="small" readOnly />
        </div>
        <div className="w-full">
          <Rating name="size-small" defaultValue={4} size="small" readOnly />
        </div>
        <div className="w-full">
          <Rating name="size-small" defaultValue={3} size="small" readOnly />
        </div>
        <div className="w-full">
          <Rating name="size-small" defaultValue={2} size="small" readOnly />
        </div>
        <div className="w-full">
          <Rating name="size-small" defaultValue={1} size="small" readOnly />
        </div>
      </div>
    </aside>
  );
};
