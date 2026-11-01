package com.movsphere.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.movsphere.dto.BookingResponse;
import com.movsphere.service.BookingService;

@RestController
@RequestMapping("/api/driver/jobs")
@PreAuthorize("hasRole('DRIVER')")
public class DriverJobController {

    private final BookingService bookingService;

    public DriverJobController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAvailableJobs(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        List<BookingResponse> response = bookingService.getAvailableJobsForDriver(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{bookingReference}/accept")
    public ResponseEntity<BookingResponse> acceptJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String bookingReference
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        BookingResponse response = bookingService.acceptJob(bookingReference, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<BookingResponse> rejectJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long id
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        BookingResponse response = bookingService.rejectJob(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/stage")
    public ResponseEntity<BookingResponse> updateBookingStage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("id") Long id,
            @RequestParam("status") String status
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        BookingResponse response = bookingService.updateBookingStage(id, status, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
