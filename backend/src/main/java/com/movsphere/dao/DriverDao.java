package com.movsphere.dao;

import com.movsphere.entity.DriverEntity;
import java.util.List;
import java.util.Optional;

public interface DriverDao {
    DriverEntity save(DriverEntity driver);
    Optional<DriverEntity> findById(Long id);
    Optional<DriverEntity> findByUserId(Long userId);
    Optional<DriverEntity> findByUserEmail(String email);
    List<DriverEntity> findAvailableDrivers();
}
