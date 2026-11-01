package com.movsphere.entity;

public enum BookingStatus {
    PENDING,
    SEARCHING_DRIVER,
    DRIVER_ASSIGNED,
    ACCEPTED,
    HEADING_TO_PICKUP,
    ARRIVED_AT_PICKUP,
    PASSENGER_ONBOARD,
    TRIP_STARTED,
    COMPLETED,
    CANCELLED
}