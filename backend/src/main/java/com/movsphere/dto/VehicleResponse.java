package com.movsphere.dto;

public class VehicleResponse {
    private Long id;
    private String vehicleNumber;
    private String vehicleType;
    private String capacity;
    private boolean available;

    public VehicleResponse() {
    }

    public VehicleResponse(Long id, String vehicleNumber, String vehicleType, String capacity, boolean available) {
        this.id = id;
        this.vehicleNumber = vehicleNumber;
        this.vehicleType = vehicleType;
        this.capacity = capacity;
        this.available = available;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getCapacity() {
        return capacity;
    }

    public void setCapacity(String capacity) {
        this.capacity = capacity;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }
}
