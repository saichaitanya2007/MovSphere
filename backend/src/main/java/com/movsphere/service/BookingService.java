package com.movsphere.service;

import com.movsphere.dto.BookingRequest;
import com.movsphere.dto.BookingResponse;
import java.util.List;

public interface BookingService {
    BookingResponse createBooking(String customerEmail, BookingRequest request);
    List<BookingResponse> getMyBookings(String userEmail);
    BookingResponse getBookingById(Long id, String userEmail);
    BookingResponse cancelBooking(Long id, String userEmail);
    List<BookingResponse> getAvailableJobsForDriver(String driverEmail);
    BookingResponse acceptJob(String bookingReference, String driverEmail);
    BookingResponse rejectJob(Long id, String driverEmail);
    BookingResponse updateBookingStage(Long id, String status, String driverEmail);
}
