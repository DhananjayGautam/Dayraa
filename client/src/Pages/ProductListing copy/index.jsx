import React, { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import ProductItem from "../../components/ProductItem";
import ProductItemListView from "../../components/ProductItemListView";
import Button from "@mui/material/Button";
import { IoGridSharp } from "react-icons/io5";
import { LuMenu } from "react-icons/lu";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchDataFromApi, postData } from "../../utils/api";
import ProductLoadingGrid from "../../components/ProductLoading/productLoadingGrid";
import { useNavigate, useSearchParams } from "react-router-dom";

const ProductListing = () => {
  const [itemView, setItemView] = useState("grid");
  const [anchorEl, setAnchorEl] = React.useState(null);

  const [isLoading, setisLoading] = useState(false);
  const [productData, setProductData] = useState([]);
  const [windowUrl, setWindowUrl] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  
  const open = Boolean(anchorEl);

  const { id } = useParams();
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0);

    getProducts();


  }, [location])


  const getProducts = () => {

    let url = window.location.href;

    setWindowUrl(url)

    let apiEndPoint = "";
    let apiEndPointCat = "";
    let apiEndPointSubCat = "";
    const queryParameters = new URLSearchParams(location.search);

    if (url.includes("catId")) {
      const categoryId = queryParameters.get('catId');
      apiEndPoint = `/api/product/getAllProductsByCatId/${categoryId}`;
    }

    if (url.includes("subCatId")) {
      const subCategoryId = queryParameters.get('subCatId');
      apiEndPoint = `/api/product/getAllProductsBySubCatId/${subCategoryId}`;
    }

    setisLoading(true);
    setProductData([]);
    fetchDataFromApi(`${apiEndPoint}`).then((res) => {
      if (res?.error === false) {
        setProductData(res);
        setTimeout(() => {
          setisLoading(false);
        }, 200);
      }
    });

    fetchDataFromApi(`${apiEndPointCat}`).then((res) => {
      if (res?.error === false) {
        setCurrentCatInfo(res?.category)
      }
    });

    fetchDataFromApi(`${apiEndPointSubCat}`).then((res) => {
      if (res?.error === false) {
        setCurrentSubCatInfo(res?.category)
      }
    });

  }


  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };


  const filterProducts = (data) => {
    if (data?.products?.length !== 0) {
      setProductData(data);
    } else {
      getProducts();
    }

  }

  return (
    <section className="pt-0 pb-0">

      <div className="bg-white p-2">
        <div className="container flex gap-3">
          <div className="sidebarWrapper w-[20%] h-full bg-white">
            <Sidebar windowUrl={windowUrl} productData={productData} filterProducts={filterProducts} getProducts={getProducts} setisLoading={setisLoading} isLoading={isLoading} setSearchParams={setSearchParams} setProductData={setProductData} />


          </div>

          <div className="rightContent w-[80%] py-3">
            <div className="bg-[#f1f1f1] p-2 w-full mb-4 rounded-md flex items-center justify-between">
              <div className="col1 flex items-center itemViewActions">
                <Button
                  className={`!w-[40px] !h-[40px] !min-w-[40px] !rounded-full 
                    !text-[#000] ${itemView === "list" && "active"}`}
                  onClick={() => setItemView("list")}
                >
                  <LuMenu className="text-[rgba(0,0,0,0.7)]" />
                </Button>
                <Button
                  className={`!w-[40px] !h-[40px] !min-w-[40px] !rounded-full 
                    !text-[#000] ${itemView === "grid" && "active"}`}
                  onClick={() => setItemView("grid")}
                >
                  <IoGridSharp className="text-[rgba(0,0,0,0.7)]" />
                </Button>

                <span className="text-[14px] font-[500] pl-3 text-[rgba(0,0,0,0.7)]">
                  There are {productData?.products?.length} products.
                </span>
              </div>

              <div className="col2 ml-auto flex items-center justify-end gap-3 pr-4">
                <span className="text-[14px] font-[500] pl-3 text-[rgba(0,0,0,0.7)]">
                  Sort By
                </span>

                <Button
                  id="basic-button"
                  aria-controls={open ? "basic-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                  onClick={handleClick}
                  className="!bg-white !text-[12px] !text-[#000] !capitalize !border-2 
                  !border-[#000]"
                >
                  Sales, highest to lowest
                </Button>

                <Menu
                  id="basic-menu"
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  MenuListProps={{
                    "aria-labelledby": "basic-button",
                  }}
                >
                  <MenuItem
                    onClick={handleClose}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Sales, highest to lowest
                  </MenuItem>
                  <MenuItem
                    onClick={handleClose}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Relevance
                  </MenuItem>
                  <MenuItem
                    onClick={handleClose}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Name, A to Z
                  </MenuItem>
                  <MenuItem
                    onClick={handleClose}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Name, Z to A
                  </MenuItem>
                  <MenuItem
                    onClick={handleClose}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Price, low to high
                  </MenuItem>
                  <MenuItem
                    onClick={handleClose}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Price, high to low
                  </MenuItem>
                </Menu>
              </div>
            </div>

            <div
              className={`grid ${itemView === "grid"
                ? "grid-cols-5 md:grid-cols-5"
                : "grid-cols-1 md:grid-cols-1"
                } gap-4`}
            >
              {itemView === "grid" ? (
                <>
                  {
                    isLoading === true ? <ProductLoadingGrid view={itemView} /> :
                      productData?.products?.length !== 0 && productData?.products?.map((item, index) => {
                        return (
                          <ProductItem key={index} item={item} />
                        )
                      })

                  }

                </>
              ) : (
                <>
                  {
                    isLoading === true ? <ProductLoadingGrid view={itemView} /> :
                      productData?.products?.length !== 0 && productData?.products?.map((item, index) => {
                        return (
                          <ProductItemListView key={index} item={item} />
                        )
                      })

                  }

                </>

              )}
            </div>


          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductListing;
