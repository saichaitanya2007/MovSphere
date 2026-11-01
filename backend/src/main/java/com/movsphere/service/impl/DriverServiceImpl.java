package com.movsphere.service.impl;

import com.movsphere.dao.DriverDao;
import com.movsphere.dao.UserDao;
import com.movsphere.dao.VehicleDao;
import com.movsphere.dto.DriverOnboardRequest;
import com.movsphere.dto.DriverResponse;
import com.movsphere.dto.VehicleResponse;
import com.movsphere.entity.DriverEntity;
import com.movsphere.entity.UserEntity;
import com.movsphere.entity.UserRole;
import com.movsphere.entity.VehicleEntity;
import com.movsphere.exception.DuplicateEmailException;
import com.movsphere.exception.ResourceNotFoundException;
import com.movsphere.exception.UnauthorizedAccessException;
import com.movsphere.service.DriverService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverServiceImpl implements DriverService {

    private final DriverDao driverDao;
    private final UserDao userDao;
    private final VehicleDao vehicleDao;

    public DriverServiceImpl(DriverDao driverDao, UserDao userDao, VehicleDao vehicleDao) {
        this.driverDao = driverDao;
        this.userDao = userDao;
        this.vehicleDao = vehicleDao;
    }

    @Override
    @Transactional
    public DriverResponse onboardDriver(String email, DriverOnboardRequest request) {
        UserEntity user = userDao.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (user.getRole() != UserRole.DRIVER) {
            throw new UnauthorizedAccessException("Only users with DRIVER role can onboard as drivers.");
        }

        if (driverDao.findByUserId(user.getId()).isPresent()) {
            throw new DuplicateEmailException("Driver profile already exists for this user.");
        }

        // Validate vehicle number unique
        if (vehicleDao.findByVehicleNumber(request.getVehicleNumber()).isPresent()) {
            throw new DuplicateEmailException("Vehicle number " + request.getVehicleNumber() + " is already registered.");
        }

        VehicleEntity vehicle = new VehicleEntity();
        vehicle.setVehicleNumber(request.getVehicleNumber().toUpperCase());
        vehicle.setVehicleType(request.getVehicleType());
        vehicle.setCapacity(request.getVehicleCapacity());
        vehicle.setAvailable(true);

        DriverEntity driver = new DriverEntity();
        driver.setUser(user);
        driver.setVehicle(vehicle);
        driver.setLicenseFileName(request.getLicenseFileName());
        driver.setLicenseFileSize(request.getLicenseFileSize());
        driver.setExperienceYears(request.getExperienceYears());
        driver.setWorkType(request.getWorkType() != null ? request.getWorkType() : "ride-booking");
        driver.setStatus("offline"); // start offline
        driver.setRating(5.0);
        driver.setTotalTrips(0);

        DriverEntity savedDriver = driverDao.save(driver);
        return mapToResponse(savedDriver);
    }

    @Override
    public DriverResponse getDriverProfile(String email) {
        DriverEntity driver = driverDao.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found for user: " + email));
        return mapToResponse(driver);
    }

    @Override
    @Transactional
    public DriverResponse updateStatus(String email, String status) {
        DriverEntity driver = driverDao.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found for user: " + email));

        String cleanStatus = status.toLowerCase().trim();
        if (!cleanStatus.equals("offline") && !cleanStatus.equals("online") && !cleanStatus.equals("on-trip")) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Allowed values are: offline, online, on-trip.");
        }

        driver.setStatus(cleanStatus);

        // Synchronize vehicle availability
        if (driver.getVehicle() != null) {
            if (cleanStatus.equals("on-trip")) {
                driver.getVehicle().setAvailable(false);
            } else {
                driver.getVehicle().setAvailable(true);
            }
        }

        DriverEntity savedDriver = driverDao.save(driver);
        return mapToResponse(savedDriver);
    }

    private DriverResponse mapToResponse(DriverEntity driver) {
        VehicleResponse vr = null;
        if (driver.getVehicle() != null) {
            VehicleEntity v = driver.getVehicle();
            vr = new VehicleResponse(v.getId(), v.getVehicleNumber(), v.getVehicleType(), v.getCapacity(), v.isAvailable());
        }
        return new DriverResponse(
                driver.getId(),
                driver.getUser().getId(),
                driver.getUser().getName(),
                driver.getUser().getEmail(),
                driver.getUser().getPhone(),
                driver.getStatus(),
                driver.getRating(),
                driver.getTotalTrips(),
                vr,
                driver.getLicenseFileName(),
                driver.getExperienceYears(),
                driver.getWorkType()
        );
    }
}
