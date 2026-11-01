package com.movsphere.dao;

import com.movsphere.entity.BookingEntity;
import java.util.List;
import java.util.Optional;

public interface BookingDao {
    BookingEntity save(BookingEntity booking);
    Optional<BookingEntity> findById(Long id);
    Optional<BookingEntity> findByBookingId(String bookingId);
    List<BookingEntity> findByCustomerId(Long customerId);
    List<BookingEntity> findAvailableJobs();
    List<BookingEntity> findByDriverId(Long driverId);
}
