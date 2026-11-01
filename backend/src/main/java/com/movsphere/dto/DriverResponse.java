package com.movsphere.dto;

public class DriverResponse {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String status;
    private Double rating;
    private Integer totalTrips;
    private VehicleResponse vehicle;
    private String licenseFileName;
    private Integer experienceYears;
    private String workType;

    public DriverResponse() {
    }

    public DriverResponse(Long id, Long userId, String name, String email, String phone, String status, Double rating, Integer totalTrips, VehicleResponse vehicle, String licenseFileName) {
        this(id, userId, name, email, phone, status, rating, totalTrips, vehicle, licenseFileName, 0, "ride-booking");
    }

    public DriverResponse(Long id, Long userId, String name, String email, String phone, String status, Double rating, Integer totalTrips, VehicleResponse vehicle, String licenseFileName, Integer experienceYears, String workType) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.status = status;
        this.rating = rating;
        this.totalTrips = totalTrips;
        this.vehicle = vehicle;
        this.licenseFileName = licenseFileName;
        this.experienceYears = experienceYears;
        this.workType = workType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Integer getTotalTrips() {
        return totalTrips;
    }

    public void setTotalTrips(Integer totalTrips) {
        this.totalTrips = totalTrips;
    }

    public VehicleResponse getVehicle() {
        return vehicle;
    }

    public void setVehicle(VehicleResponse vehicle) {
        this.vehicle = vehicle;
    }

    public String getLicenseFileName() {
        return licenseFileName;
    }

    public void setLicenseFileName(String licenseFileName) {
        this.licenseFileName = licenseFileName;
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
}
