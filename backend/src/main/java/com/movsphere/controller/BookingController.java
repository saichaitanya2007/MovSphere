package com.movsphere.controller;

import com.movsphere.dto.BookingRequest;
import com.movsphere.dto.BookingResponse;
import com.movsphere.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SHIPPER', 'ADMIN')")
    public ResponseEntity<BookingResponse> createBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BookingRequest request
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        BookingResponse response = bookingService.createBooking(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponse>> getMyBookings(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        List<BookingResponse> response = bookingService.getMyBookings(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> getBookingById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        BookingResponse response = bookingService.getBookingById(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> cancelBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        BookingResponse response = bookingService.cancelBooking(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
