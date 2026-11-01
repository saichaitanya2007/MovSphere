package com.movsphere.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "marketplace_orders", uniqueConstraints = @UniqueConstraint(columnNames = "order_number"))
public class MarketplaceOrderEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;
    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;
    private Long sellerId;
    @Column(nullable = false, length = 80) private String productId;
    @Column(nullable = false, length = 180) private String productName;
    @Column(nullable = false) private Integer quantity;
    @Column(nullable = false, length = 40) private String unitType;
    @Column(nullable = false) private Double pricePerUnit;
    @Column(nullable = false) private Double totalAmount;
    @Column(nullable = false) private Integer deliveryDays;
    @Column(nullable = false, length = 255) private String presentLocation;
    @Column(nullable = false, length = 80) private String status;
    @Column(nullable = false, length = 150) private String sellerName;
    @Column(nullable = false, updatable = false) private Instant createdAt;
    @Column(nullable = false) private Instant updatedAt;

    @PrePersist public void prePersist() { Instant now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate public void preUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String value) { orderNumber = value; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long value) { buyerId = value; }
    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long value) { sellerId = value; }
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
    public String getStatus() { return status; }
    public void setStatus(String value) { status = value; }
    public String getSellerName() { return sellerName; }
    public void setSellerName(String value) { sellerName = value; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
