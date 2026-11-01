package com.movsphere.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class MarketplaceOrderRequest {
    @NotBlank @Size(max = 50) private String orderNumber;
    @NotBlank @Size(max = 80) private String productId;
    @NotBlank @Size(max = 180) private String productName;
    @NotNull @Positive private Integer quantity;
    @NotBlank @Size(max = 40) private String unitType;
    @NotNull @Positive private Double pricePerUnit;
    @NotNull @Positive private Double totalAmount;
    @NotNull @Positive private Integer deliveryDays;
    @NotBlank @Size(max = 255) private String presentLocation;
    @NotBlank @Size(max = 150) private String sellerName;
    private Long sellerId;

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String value) { orderNumber = value; }
    public String getProductId() { return productId; }
    public void setProductId(String value) { productId = value; }
    public String getProductName() { return productName; }
    public void setProductName(String value) { productName = value; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer value) { quantity = value; }
    public String getUnitType() { return unitType; }
    public void setUnitType(String value) { unitType = value; }
    public Double getPricePerUnit() { return pricePerUnit; }
    public void setPricePerUnit(Double value) { pricePerUnit = value; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double value) { totalAmount = value; }
    public Integer getDeliveryDays() { return deliveryDays; }
    public void setDeliveryDays(Integer value) { deliveryDays = value; }
    public String getPresentLocation() { return presentLocation; }
    public void setPresentLocation(String value) { presentLocation = value; }
    public String getSellerName() { return sellerName; }
    public void setSellerName(String value) { sellerName = value; }
    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long value) { sellerId = value; }
}
