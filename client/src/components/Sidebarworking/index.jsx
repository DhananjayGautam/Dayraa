import React, { useContext, useEffect, useState } from "react";
import "../Sidebar/style.css";
import { Collapse } from "react-collapse";
import { FaAngleDown } from "react-icons/fa6";
import Button from "@mui/material/Button";
import { FaAngleUp } from "react-icons/fa6";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";
import Rating from "@mui/material/Rating";

import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { MyContext } from "../../App";
import Checkbox from "@mui/material/Checkbox";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

export const Sidebar = (props) => {
  const [isOpenCategoryFilter, setIsOpenCategoryFilter] = useState(true);
  const [isOpenAvailFilter, setisOpenAvailFilter] = useState(false);
  const [isOpenSizeFilter, setisOpenSizeFilter] = useState(false);

  const [filterCat, setfilterCat] = useState();
  const [selectedCatId, setSelectedCatId] = useState("");
  const [price, setPrice] = useState([100, 70000]);

  const context = useContext(MyContext);
  const history = useNavigate();

  const location = useLocation()

  useEffect(() => {
    props.filterByPrice(price, selectedCatId);
  }, [price,location]);

  const handleChange = (event) => {
    setfilterCat(event.target.value);
    props.filterData(event.target.value);
    setSelectedCatId(event.target.value);
  };



  const filterByRating = (rating) => {
    props.filterByRating(rating);
  };



  return (
    <aside className="sidebar py-5 sticky top-[50px] z-50">
      <div className="box">
        <h3 className="w-full mb-3 text-[16px] font-[600] flex items-center pr-5 cursor-pointer" onClick={() => setIsOpenCategoryFilter(!isOpenCategoryFilter)}>
          Shop by Category
          <Button
            className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]"
          >
            {isOpenCategoryFilter === true ? <FaAngleUp /> : <FaAngleDown />}
          </Button>
        </h3>
        <Collapse isOpened={isOpenCategoryFilter}>
          <div className="scroll px-4 relative -left-[13px]">
            <RadioGroup
              aria-labelledby="demo-controlled-radio-buttons-group"
              name="controlled-radio-buttons-group"
              value={filterCat}
              onChange={(e) => handleChange(e)}
            >
              {context?.catData?.length !== 0 &&
                context?.catData?.map((item) => {
                  return (
                    item?.children?.length !== 0 && item?.children?.map((subCat, index_) => {
                      return (
                        <FormControlLabel
                          key={index_}
                          value={subCat?._id}
                          control={<Radio size="small" />}
                          label={subCat?.name}
                          onClick={() => {
                            history(
                              `/products?subCatId=${subCat?._id}`
                            );
                          }}
                        />
                      );
                    })
                  )

                })}
            </RadioGroup>
          </div>
        </Collapse>
      </div>

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

        <div className="w-full cursor-pointer" onClick={() => filterByRating(5)}>
          <Rating name="size-small" defaultValue={5} size="small" readOnly />
        </div>
        <div className="w-full cursor-pointer" onClick={() => filterByRating(4)}>
          <Rating name="size-small" defaultValue={4} size="small" readOnly />
        </div>
        <div className="w-full cursor-pointer" onClick={() => filterByRating(3)}>
          <Rating name="size-small" defaultValue={3} size="small" readOnly />
        </div>
        <div className="w-full cursor-pointer" onClick={() => filterByRating(2)}>
          <Rating name="size-small" defaultValue={2} size="small" readOnly />
        </div>
        <div className="w-full cursor-pointer" onClick={() => filterByRating(1)}>
          <Rating name="size-small" defaultValue={1} size="small" readOnly />
        </div>
      </div>
    </aside>
  );
};
