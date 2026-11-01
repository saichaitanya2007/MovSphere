package com.movsphere.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "warehouse_locations", uniqueConstraints = @UniqueConstraint(columnNames = "warehouse_code"))
public class WarehouseLocationEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 20)
    @Column(name = "warehouse_code", nullable = false, unique = true, length = 20)
    private String warehouseCode;
    @NotBlank @Size(max = 80) @Column(nullable = false, length = 80)
    private String state;
    @NotBlank @Size(max = 100) @Column(nullable = false, length = 100)
    private String warehouseName;
    @NotBlank @Size(max = 80) @Column(nullable = false, length = 80)
    private String city;
    @NotBlank @Size(max = 255) @Column(nullable = false, length = 255)
    private String address;
    @NotNull @Column(nullable = false)
    private Double latitude;
    @NotNull @Column(nullable = false)
    private Double longitude;

    public Long getId() { return id; }
    public String getWarehouseCode() { return warehouseCode; }
    public void setWarehouseCode(String value) { warehouseCode = value; }
    public String getState() { return state; }
    public void setState(String value) { state = value; }
    public String getWarehouseName() { return warehouseName; }
    public void setWarehouseName(String value) { warehouseName = value; }
    public String getCity() { return city; }
    public void setCity(String value) { city = value; }
    public String getAddress() { return address; }
    public void setAddress(String value) { address = value; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double value) { latitude = value; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double value) { longitude = value; }
}
