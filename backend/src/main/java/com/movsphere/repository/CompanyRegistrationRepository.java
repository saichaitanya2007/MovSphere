package com.movsphere.repository;

import com.movsphere.entity.CompanyRegistrationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRegistrationRepository extends JpaRepository<CompanyRegistrationEntity, Long> {
    Optional<CompanyRegistrationEntity> findByUserId(Long userId);
}
