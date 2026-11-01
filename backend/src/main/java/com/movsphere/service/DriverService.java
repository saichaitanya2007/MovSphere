package com.movsphere.service;

import com.movsphere.dto.DriverOnboardRequest;
import com.movsphere.dto.DriverResponse;

public interface DriverService {
    DriverResponse onboardDriver(String email, DriverOnboardRequest request);
    DriverResponse getDriverProfile(String email);
    DriverResponse updateStatus(String email, String status);
}
