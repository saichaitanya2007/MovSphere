package com.movsphere.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
@Table(name = "bookings", uniqueConstraints = @UniqueConstraint(columnNames = "bookingId"))
public class BookingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, unique = true)
    private String bookingId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserEntity customer;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false)
    private String riderName;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String pickupLabel;

    @NotNull
    @Column(nullable = false)
    private Double pickupLatitude;

    @NotNull
    @Column(nullable = false)
    private Double pickupLongitude;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String destinationLabel;

    @NotNull
    @Column(nullable = false)
    private Double destinationLatitude;

    @NotNull
    @Column(nullable = false)
    private Double destinationLongitude;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false)
    private String vehicleType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id")
    private VehicleEntity vehicle;

    @NotNull
    @Column(nullable = false)
    private Double distanceKm;

    @NotNull
    @Column(nullable = false)
    private Double totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    private BookingStatus status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id")
    private DriverEntity driver;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false)
    private String pickupWindow;

    @Size(max = 1000)
    @Column(length = 1000)
    private String notes;

    @NotNull
    @Column(nullable = false)
    private Integer passengers;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    public UserEntity getCustomer() {
        return customer;
    }

    public void setCustomer(UserEntity customer) {
        this.customer = customer;
    }

    public String getRiderName() {
        return riderName;
    }

    public void setRiderName(String riderName) {
        this.riderName = riderName;
    }

    public String getPickupLabel() {
        return pickupLabel;
    }

    public void setPickupLabel(String pickupLabel) {
        this.pickupLabel = pickupLabel;
    }

    public Double getPickupLatitude() {
        return pickupLatitude;
    }

    public void setPickupLatitude(Double pickupLatitude) {
        this.pickupLatitude = pickupLatitude;
    }

    public Double getPickupLongitude() {
        return pickupLongitude;
    }

    public void setPickupLongitude(Double pickupLongitude) {
        this.pickupLongitude = pickupLongitude;
    }

    public String getDestinationLabel() {
        return destinationLabel;
    }

    public void setDestinationLabel(String destinationLabel) {
        this.destinationLabel = destinationLabel;
    }

    public Double getDestinationLatitude() {
        return destinationLatitude;
    }

    public void setDestinationLatitude(Double destinationLatitude) {
        this.destinationLatitude = destinationLatitude;
    }

    public Double getDestinationLongitude() {
        return destinationLongitude;
    }

    public void setDestinationLongitude(Double destinationLongitude) {
        this.destinationLongitude = destinationLongitude;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public VehicleEntity getVehicle() {
        return vehicle;
    }

    public void setVehicle(VehicleEntity vehicle) {
        this.vehicle = vehicle;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(Double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public DriverEntity getDriver() {
        return driver;
    }

    public void setDriver(DriverEntity driver) {
        this.driver = driver;
    }

    public String getPickupWindow() {
        return pickupWindow;
    }

    public void setPickupWindow(String pickupWindow) {
        this.pickupWindow = pickupWindow;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getPassengers() {
        return passengers;
    }

    public void setPassengers(Integer passengers) {
        this.passengers = passengers;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
