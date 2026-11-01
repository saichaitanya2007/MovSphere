package com.movsphere.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class DriverOnboardRequest {

    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;

    @NotBlank(message = "Vehicle number is required")
    private String vehicleNumber;

    @NotBlank(message = "Vehicle capacity is required")
    private String vehicleCapacity;

    @NotNull(message = "Experience years is required")
    @Min(value = 0, message = "Experience years must be positive")
    private Integer experienceYears;

    @NotBlank(message = "Work type is required")
    private String workType;

    @NotBlank(message = "License file name is required")
    private String licenseFileName;

    @NotNull(message = "License file size is required")
    private Long licenseFileSize;

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getVehicleCapacity() {
        return vehicleCapacity;
    }

    public void setVehicleCapacity(String vehicleCapacity) {
        this.vehicleCapacity = vehicleCapacity;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public String getWorkType() {
        return workType;
    }

    public void setWorkType(String workType) {
        this.workType = workType;
    }

    public String getLicenseFileName() {
        return licenseFileName;
    }

    public void setLicenseFileName(String licenseFileName) {
        this.licenseFileName = licenseFileName;
    }

    public Long getLicenseFileSize() {
        return licenseFileSize;
    }

    public void setLicenseFileSize(Long licenseFileSize) {
        this.licenseFileSize = licenseFileSize;
    }
}
