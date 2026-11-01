package com.movsphere.dao;

import com.movsphere.entity.VehicleEntity;
import java.util.Optional;

public interface VehicleDao {
    VehicleEntity save(VehicleEntity vehicle);
    Optional<VehicleEntity> findById(Long id);
    Optional<VehicleEntity> findByVehicleNumber(String vehicleNumber);
}
