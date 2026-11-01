package com.movsphere.controller;

import com.movsphere.dto.DriverOnboardRequest;
import com.movsphere.dto.DriverResponse;
import com.movsphere.service.DriverService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    @PostMapping("/onboard")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverResponse> onboardDriver(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DriverOnboardRequest request
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        DriverResponse response = driverService.onboardDriver(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverResponse> getDriverProfile(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        DriverResponse response = driverService.getDriverProfile(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/status")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverResponse> updateStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String status
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        DriverResponse response = driverService.updateStatus(userDetails.getUsername(), status);
        return ResponseEntity.ok(response);
    }
}
