import React, { useState, useEffect } from 'react';
import { Button } from "@mui/material";
import { FaAngleDown } from "react-icons/fa6";
import Badge from "../../Components/Badge";
import SearchBox from '../../Components/SearchBox';
import { FaAngleUp } from "react-icons/fa6";
import { deleteData, editData, fetchDataFromApi } from '../../utils/api';
import Pagination from "@mui/material/Pagination";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useContext } from 'react';
import { MyContext } from "../../App.jsx";
import jsPDF from 'jspdf';
import { TextField } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';

export const Orders = () => {

  const [isOpenOrderdProduct, setIsOpenOrderdProduct] = useState(null);
  const [orderStatus, setOrderStatus] = useState('');
  const [ordersData, setOrdersData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pageOrder, setPageOrder] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalOrdersData, setTotalOrdersData] = useState([]);
  const [todayOrders, setTodayOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filteredOrdersByDate, setFilteredOrdersByDate] = useState([]);

  const context = useContext(MyContext);

  const isShowOrderdProduct = (index) => {
    if (isOpenOrderdProduct === index) {
      setIsOpenOrderdProduct(null);
    } else {
      setIsOpenOrderdProduct(index);
    }
  };

  const handleChange = (event, id) => {
    setOrderStatus(event.target.value);
    const obj = {
      id: id,
      order_status: event.target.value
    }
    editData(`/api/order/order-status/${id}`, obj).then((res) => {
      if (res?.data?.error === false) {
        context.alertBox("success", res?.data?.message);
      }
    })
  };

  useEffect(() => {
    context?.setProgress(50);
    fetchDataFromApi(`/api/order/order-list?page=${pageOrder}&limit=5`).then((res) => {
      if (res?.error === false) {
        setOrdersData(res?.data)
        context?.setProgress(100);
      }
    })
    fetchDataFromApi(`/api/order/order-list`).then((res) => {
      if (res?.error === false) {
        setTotalOrdersData(res)
        // Filter today's orders
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = res?.data?.filter(order => 
          order?.createdAt?.split("T")[0] === today
        );
        setTodayOrders(todayOrders || []);
      }
    })
  }, [orderStatus, pageOrder])

  useEffect(() => {
    // Filter orders based on search query
    if (searchQuery !== "") {
      const filteredOrders = totalOrdersData?.data?.filter((order) =>
        order._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.userId?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.userId?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.createdAt.includes(searchQuery)
      );
      setOrdersData(filteredOrders)
    } else {
      fetchDataFromApi(`/api/order/order-list?page=${pageOrder}&limit=5`).then((res) => {
        if (res?.error === false) {
          setOrders(res)
          setOrdersData(res?.data)
        }
      })
    }
  }, [searchQuery])

  // Filter orders by selected date
  useEffect(() => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const filtered = totalOrdersData?.data?.filter(order => 
        order?.createdAt?.split("T")[0] === formattedDate
      );
      setFilteredOrdersByDate(filtered || []);
    } else {
      setFilteredOrdersByDate([]);
    }
  }, [selectedDate, totalOrdersData]);

  const deleteOrder = (id) => {
    if (context?.userData?.role === "ADMIN") {
      deleteData(`/api/order/deleteOrder/${id}`).then((res) => {
        fetchDataFromApi(`/api/order/order-list?page=${pageOrder}&limit=5`).then((res) => {
          if (res?.error === false) {
            setOrdersData(res?.data)
            context?.setProgress(100);
            context.alertBox("success", "Order Delete successfully!");
          }
        })
        fetchDataFromApi(`/api/order/order-list`).then((res) => {
          if (res?.error === false) {
            setTotalOrdersData(res)
          }
        })
      })
    } else {
      context.alertBox("error", "Only admin can delete data");
    }
  }

  // Function to create a table manually
  const createTable = (doc, headers, data, startY, title = '') => {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    const rowHeight = 8;
    let currentY = startY;
    
    // Add title if provided
    if (title) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(title, margin, currentY);
      currentY += 8;
    }
    
    // Calculate column widths based on content
    const colWidths = headers.map((header, index) => {
      const headerWidth = doc.getTextWidth(header) + 4;
      const dataWidths = data.map(row => doc.getTextWidth(String(row[index] || '')) + 4);
      return Math.max(headerWidth, ...dataWidths, 20);
    });
    
    // Adjust column widths to fit page
    const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const scaleFactor = (pageWidth - (margin * 2)) / totalWidth;
    const adjustedWidths = colWidths.map(width => width * scaleFactor);
    
    // Draw table headers
    doc.setFontSize(9);
    doc.setFillColor(66, 135, 245);
    doc.setTextColor(255, 255, 255);
    
    let xPos = margin;
    headers.forEach((header, index) => {
      doc.rect(xPos, currentY, adjustedWidths[index], rowHeight, 'F');
      doc.text(header, xPos + 2, currentY + 5);
      xPos += adjustedWidths[index];
    });
    
    currentY += rowHeight;
    
    // Draw table rows
    doc.setTextColor(0, 0, 0);
    data.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (currentY > doc.internal.pageSize.height - 20) {
        doc.addPage();
        currentY = 20;
        // Redraw headers on new page
        xPos = margin;
        doc.setFillColor(66, 135, 245);
        doc.setTextColor(255, 255, 255);
        headers.forEach((header, index) => {
          doc.rect(xPos, currentY, adjustedWidths[index], rowHeight, 'F');
          doc.text(header, xPos + 2, currentY + 5);
          xPos += adjustedWidths[index];
        });
        currentY += rowHeight;
        doc.setTextColor(0, 0, 0);
      }
      
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(240, 240, 240);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      
      xPos = margin;
      row.forEach((cell, cellIndex) => {
        doc.rect(xPos, currentY, adjustedWidths[cellIndex], rowHeight, 'F');
        doc.text(String(cell || ''), xPos + 2, currentY + 5);
        xPos += adjustedWidths[cellIndex];
      });
      
      currentY += rowHeight;
    });
    
    return currentY + 10;
  };

  const generateTodayOrdersPDF = () => {
    if (todayOrders.length === 0) {
      context.alertBox("info", "No orders found for today");
      return;
    }

    generatePDF(todayOrders, "TODAY'S ORDERS REPORT");
  };

  const generateDateOrdersPDF = () => {
    if (!selectedDate) {
      context.alertBox("info", "Please select a date first");
      return;
    }

    if (filteredOrdersByDate.length === 0) {
      context.alertBox("info", `No orders found for ${format(selectedDate, 'MMMM dd, yyyy')}`);
      return;
    }

    generatePDF(filteredOrdersByDate, `ORDERS REPORT - ${format(selectedDate, 'MMMM dd, yyyy')}`);
  };

  const generatePDF = (ordersToGenerate, title) => {
    try {
      const doc = new jsPDF();
      let yPosition = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;
      const sectionGap = 15;

      // Function to load and add image to PDF
      const addImageToPDF = async (imageUrl, x, y, width, height) => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const scaleFactor = 2;
          canvas.width = width * scaleFactor;
          canvas.height = height * scaleFactor;
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          
          return new Promise((resolve) => {
            img.onload = function() {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const imageData = canvas.toDataURL('image/png', 1.0);
              doc.addImage(imageData, 'PNG', x, y, width, height);
              resolve(true);
            };
            
            img.onerror = function() {
              drawImagePlaceholder(x, y, width, height);
              resolve(false);
            };
            
            img.src = imageUrl;
          });
        } catch (error) {
          drawImagePlaceholder(x, y, width, height);
          return false;
        }
      };

      const drawImagePlaceholder = (x, y, width = 25, height = 25) => {
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(250, 250, 250);
        doc.rect(x, y, width, height, 'FD');
        
        doc.setFillColor(220, 220, 220);
        doc.roundedRect(x + width/4, y + height/3, width/2, height/3, 2, 2, 'F');
        doc.setFillColor(180, 180, 180);
        doc.circle(x + width/2, y + height/2, width/8, 'F');
        
        doc.setFontSize(5);
        doc.setTextColor(120, 120, 120);
        doc.text("No Image", x + width/3, y + height - 3);
      };

      // Title
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text(title, margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Total Orders: ${ordersToGenerate.length}`, margin, yPosition);
      yPosition += sectionGap;

      const cashOrders = ordersToGenerate.filter(order => !order.paymentId || order.paymentId === 'CASH ON DELIVERY');
      const totalCashAmount = cashOrders.reduce((sum, order) => sum + (order.totalAmt || 0), 0);

      const processOrders = async () => {
        for (let index = 0; index < ordersToGenerate.length; index++) {
          const order = ordersToGenerate[index];
          
          if (yPosition > pageHeight - 100) {
            doc.addPage();
            yPosition = 20;
          }

          // Order Header
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text(`ORDER ${index + 1}`, margin, yPosition);
          yPosition += 8;

          // Order Details
          doc.setFontSize(9);
          doc.text(`Order ID: ${order._id || 'N/A'}`, margin, yPosition);
          doc.text(`Date: ${order.createdAt?.split("T")[0] || 'N/A'}`, margin + 80, yPosition);
          yPosition += 6;
          
          doc.text(`Customer: ${order.userId?.name || 'N/A'}`, margin, yPosition);
          doc.text(`Status: ${order.order_status || 'pending'}`, margin + 80, yPosition);
          yPosition += 6;
          
          doc.text(`Email: ${order.userId?.email || 'N/A'}`, margin, yPosition);
          doc.text(`Payment: ${order.paymentId ? 'Online' : 'COD'}`, margin + 80, yPosition);
          yPosition += 6;
          
          doc.text(`Phone: ${order.delivery_address?.mobile || 'N/A'}`, margin, yPosition);
          doc.text(`Amount: ₹${order.totalAmt || 0}`, margin + 80, yPosition);
          yPosition += 8;

          // Address Information
          doc.setFontSize(10);
          doc.setTextColor(66, 135, 245);
          doc.text("DELIVERY ADDRESS:", margin, yPosition);
          yPosition += 6;
          
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          
          doc.text(`Address Type: ${order.delivery_address?.addressType || 'Home'}`, margin, yPosition);
          yPosition += 5;
          
          const addressLine1 = order.delivery_address?.address_line1 || '';
          const addressLine2 = order.delivery_address?.address_line2 || '';
          doc.text(`Address: ${addressLine1} ${addressLine2}`, margin, yPosition);
          yPosition += 5;
          
          doc.text(`City/State: ${order.delivery_address?.city || ''}, ${order.delivery_address?.state || ''}, ${order.delivery_address?.country || ''}`, margin, yPosition);
          yPosition += 5;
          
          if (order.delivery_address?.landmark) {
            doc.text(`Landmark: ${order.delivery_address.landmark}`, margin, yPosition);
            yPosition += 5;
          }
          
          doc.text(`Pincode: ${order.delivery_address?.pincode || 'N/A'}`, margin, yPosition);
          yPosition += 8;

          // Products section
          if (order.products && order.products.length > 0) {
            doc.setFontSize(10);
            doc.setTextColor(66, 135, 245);
            doc.text("ORDERED PRODUCTS:", margin, yPosition);
            yPosition += 8;

            // Product table header
            doc.setFillColor(100, 100, 100);
            doc.setTextColor(255, 255, 255);
            doc.rect(margin, yPosition, 180, 8, 'F');
            
            doc.setFontSize(8);
            doc.text("Image", margin + 2, yPosition + 5);
            doc.text("Product Info", margin + 30, yPosition + 5);
            doc.text("Size", margin + 90, yPosition + 5);
            doc.text("Qty", margin + 110, yPosition + 5);
            doc.text("Price", margin + 125, yPosition + 5);
            doc.text("Subtotal", margin + 145, yPosition + 5);

            yPosition += 10;

            for (let prodIndex = 0; prodIndex < order.products.length; prodIndex++) {
              const product = order.products[prodIndex];
              
              if (yPosition > pageHeight - 40) {
                doc.addPage();
                yPosition = 20;
                
                doc.setFillColor(100, 100, 100);
                doc.setTextColor(255, 255, 255);
                doc.rect(margin, yPosition, 180, 8, 'F');
                
                doc.setFontSize(8);
                doc.text("Image", margin + 2, yPosition + 5);
                doc.text("Product Info", margin + 30, yPosition + 5);
                doc.text("Size", margin + 90, yPosition + 5);
                doc.text("Qty", margin + 110, yPosition + 5);
                doc.text("Price", margin + 125, yPosition + 5);
                doc.text("Subtotal", margin + 145, yPosition + 5);
                yPosition += 10;
              }

              if (prodIndex % 2 === 0) {
                doc.setFillColor(245, 245, 245);
                doc.rect(margin, yPosition, 180, 30, 'F');
              }

              const imageWidth = 25;
              const imageHeight = 25;
              
              if (product.image) {
                try {
                  const imageSuccess = await addImageToPDF(
                    product.image, 
                    margin + 2, 
                    yPosition + 2, 
                    imageWidth, 
                    imageHeight
                  );
                  
                  if (!imageSuccess) {
                    drawImagePlaceholder(margin + 2, yPosition + 2, imageWidth, imageHeight);
                  }
                } catch (error) {
                  drawImagePlaceholder(margin + 2, yPosition + 2, imageWidth, imageHeight);
                }
              } else {
                drawImagePlaceholder(margin + 2, yPosition + 2, imageWidth, imageHeight);
              }

              doc.setFontSize(8);
              doc.setTextColor(0, 0, 0);
              
              const productTitle = product.productTitle ? 
                (product.productTitle.length > 25 ? product.productTitle.substring(0, 25) + '...' : product.productTitle) 
                : 'N/A';
              
              doc.text(productTitle, margin + 30, yPosition + 8);
              
              doc.setFontSize(6);
              doc.setTextColor(100, 100, 100);
              const productId = product._id ? product._id.substring(0, 15) + '...' : 'N/A';
              doc.text(`ID: ${productId}`, margin + 30, yPosition + 13);
              
              doc.setFontSize(8);
              doc.setTextColor(0, 0, 0);
              const productSize = product.size && product.size.length > 0 ? 
                product.size.join(', ') : 'Standard';
              doc.text(productSize, margin + 90, yPosition + 12);
              
              doc.text(String(product.quantity || 0), margin + 110, yPosition + 12);
              doc.text(`₹${product.price || 0}`, margin + 125, yPosition + 12);
              doc.text(`₹${(product.price || 0) * (product.quantity || 0)}`, margin + 145, yPosition + 12);

              yPosition += 32;
            }

            yPosition += 10;
          }

          // Order summary
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, margin + 180, yPosition);
          yPosition += 5;
          
          doc.setFontSize(10);
          doc.setTextColor(0, 100, 0);
          doc.text(`Order Total: ₹${order.totalAmt || 0}`, margin + 120, yPosition);
          yPosition += 15;
          
          if (index < ordersToGenerate.length - 1) {
            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(0.5);
            doc.line(margin, yPosition, margin + 180, yPosition);
            yPosition += 10;
          }
        }

        // Cash on Delivery Summary
        if (cashOrders.length > 0 && yPosition < pageHeight - 50) {
          doc.setFontSize(12);
          doc.setTextColor(0, 100, 0);
          doc.text("CASH ON DELIVERY SUMMARY", margin, yPosition);
          yPosition += 8;

          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`Total COD Orders: ${cashOrders.length}`, margin, yPosition);
          yPosition += 5;
          doc.text(`Total COD Amount: ₹${totalCashAmount}`, margin, yPosition);
          yPosition += 10;
        }

        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Report generated on: ${new Date().toLocaleString()}`, margin, yPosition);
        yPosition += 5;
        doc.text(`Total Orders: ${ordersToGenerate.length}`, margin, yPosition);
        yPosition += 5;
        doc.text(`Cash on Delivery Orders: ${cashOrders.length}`, margin, yPosition);
        yPosition += 5;
        
        const totalRevenue = ordersToGenerate.reduce((sum, order) => sum + (order.totalAmt || 0), 0);
        doc.text(`Total Revenue: ₹${totalRevenue}`, margin, yPosition);
        yPosition += 5;
        
        const averageOrderValue = ordersToGenerate.length > 0 ? totalRevenue / ordersToGenerate.length : 0;
        doc.text(`Average Order Value: ₹${averageOrderValue.toFixed(2)}`, margin, yPosition);

        const fileName = selectedDate 
          ? `orders-report-${format(selectedDate, 'yyyy-MM-dd')}.pdf`
          : `today-orders-report-${new Date().toISOString().split('T')[0]}.pdf`;
        
        doc.save(fileName);
        context.alertBox("success", "PDF generated successfully!");
      };

      processOrders().catch(error => {
        console.error('Error generating PDF:', error);
        context.alertBox("error", "Failed to generate PDF. Please try again.");
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      context.alertBox("error", "Failed to generate PDF. Please try again.");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="card my-2 md:mt-4 shadow-md sm:rounded-lg bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 px-5 py-5 flex-col sm:flex-row">
          <h2 className="text-[18px] font-[600] text-left mb-2 lg:mb-0">Recent Orders</h2>
          <div className="ml-auto w-full lg:col-span-2 flex gap-4 flex-wrap">
            <div className="flex gap-4 flex-wrap">
              <Button 
                variant="contained" 
                color="primary" 
                onClick={generateTodayOrdersPDF}
                className="!bg-blue-600 !text-white !px-4 !py-2 !rounded"
                disabled={todayOrders.length === 0}
              >
                Today's PDF
              </Button>
              
              <div className="flex items-center gap-2">
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  renderInput={(params) => <TextField {...params} size="small" />}
                  maxDate={new Date()}
                />
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={generateDateOrdersPDF}
                  className="!bg-green-600 !text-white !px-4 !py-2 !rounded"
                  disabled={!selectedDate || filteredOrdersByDate.length === 0}
                >
                  Generate PDF
                </Button>
              </div>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <SearchBox
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setPageOrder={setPageOrder}
              />
            </div>
          </div>
        </div>

        {/* Display selected date info */}
        {selectedDate && (
          <div className="px-5 pb-3">
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                Showing orders for: <strong>{format(selectedDate, 'MMMM dd, yyyy')}</strong> 
                {filteredOrdersByDate.length > 0 && (
                  <span> - {filteredOrdersByDate.length} order(s) found</span>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">&nbsp;</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Order Id</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Payment Id</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Name</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Phone Number</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Address</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Pincode</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Total Amount</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Email</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">User Id</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Order Status</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Date</th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {ordersData?.length !== 0 ? (
                ordersData?.map((order, index) => {
                  return (
                    <React.Fragment key={order._id}>
                      <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <td className="px-6 py-4 font-[500]">
                          <Button
                            className="!w-[35px] !h-[35px] !min-w-[35px] !rounded-full !bg-[#f1f1f1]"
                            onClick={() => isShowOrderdProduct(index)}
                          >
                            {isOpenOrderdProduct === index ? 
                              <FaAngleUp className="text-[16px] text-[rgba(0,0,0,0.7)]" /> : 
                              <FaAngleDown className="text-[16px] text-[rgba(0,0,0,0.7)]" />
                            }
                          </Button>
                        </td>
                        <td className="px-6 py-4 font-[500]">
                          <span className="text-primary">{order?._id}</span>
                        </td>
                        <td className="px-6 py-4 font-[500]">
                          <span className="text-primary whitespace-nowrap text-[13px]">
                            {order?.paymentId ? order?.paymentId : 'CASH ON DELIVERY'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-[500] whitespace-nowrap">
                          {order?.userId?.name}
                        </td>
                        <td className="px-6 py-4 font-[500]">{order?.delivery_address?.mobile}</td>
                        <td className="px-6 py-4 font-[500]">
                          <span className='inline-block text-[13px] font-[500] p-1 bg-[#f1f1f1] rounded-md'>
                            {order?.delivery_address?.addressType}
                          </span>
                          <span className="block w-[400px]">
                            {order?.delivery_address?.address_line1 + " " +
                             order?.delivery_address?.city + " " +
                             order?.delivery_address?.landmark + " " +
                             order?.delivery_address?.state + " " +
                             order?.delivery_address?.country}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-[500]">{order?.delivery_address?.pincode}</td>
                        <td className="px-6 py-4 font-[500]">₹{order?.totalAmt}</td>
                        <td className="px-6 py-4 font-[500]">
                          {order?.userId?.email}
                        </td>
                        <td className="px-6 py-4 font-[500]">
                          <span className="text-primary">{order?.userId?._id}</span>
                        </td>
                        <td className="px-6 py-4 font-[500]">
                          <Select
                            labelId="demo-simple-select-helper-label"
                            id="demo-simple-select-helper"
                            value={order?.order_status || orderStatus}
                            label="Status"
                            size="small"
                            style={{ zoom: '80%' }}
                            className="w-full"
                            onChange={(e) => handleChange(e, order?._id)}
                          >
                            <MenuItem value={'pending'}>Pending</MenuItem>
                            <MenuItem value={'confirm'}>Confirm</MenuItem>
                            <MenuItem value={'delivered'}>Delivered</MenuItem>
                          </Select>
                        </td>
                        <td className="px-6 py-4 font-[500] whitespace-nowrap">
                          {order?.createdAt?.split("T")[0]}
                        </td>
                        <td className="px-6 py-4 font-[500] whitespace-nowrap">
                          <Button onClick={() => deleteOrder(order?._id)} variant="outlined" color="error" size="small">Delete</Button>
                        </td>
                      </tr>

                      {isOpenOrderdProduct === index && (
                        <tr>
                          <td className="pl-20" colSpan="13">
                            <div className="relative overflow-x-auto">
                              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                  <tr>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap">Product Id</th>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap">Product Title</th>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap">Image</th>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap">Quantity</th>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap">Price</th>
                                    <th scope="col" className="px-6 py-3 whitespace-nowrap">Sub Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order?.products?.map((item, index) => {
                                    return (
                                      <tr key={item?._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td className="px-6 py-4 font-[500]">
                                          <span className="text-gray-600">{item?._id}</span>
                                        </td>
                                        <td className="px-6 py-4 font-[500]">
                                          <div className="w-[200px]">{item?.productTitle}</div>
                                        </td>
                                        <td className="px-6 py-4 font-[500]">
                                          {item?.image ? (
                                            <img
                                              src={item.image}
                                              className="w-[40px] h-[40px] object-cover rounded-md"
                                              alt={item?.productTitle}
                                              onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/40x40?text=No+Image';
                                              }}
                                            />
                                          ) : (
                                            <div className="w-[40px] h-[40px] bg-gray-200 rounded-md flex items-center justify-center text-xs">
                                              No Image
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-6 py-4 font-[500] whitespace-nowrap">{item?.quantity}</td>
                                        <td className="px-6 py-4 font-[500]">₹{item?.price}</td>
                                        <td className="px-6 py-4 font-[500]">₹{item?.price * item?.quantity}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="13" className="px-6 py-4 text-center">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {orders?.totalPages > 1 && (
          <div className="flex items-center justify-center mt-10 pb-5">
            <Pagination
              showFirstButton showLastButton
              count={orders?.totalPages}
              page={pageOrder}
              onChange={(e, value) => setPageOrder(value)}
            />
          </div>
        )}
      </div>
    </LocalizationProvider>
  )
}

export default Orders;