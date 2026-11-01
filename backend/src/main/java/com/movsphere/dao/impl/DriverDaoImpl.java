package com.movsphere.dao.impl;

import com.movsphere.dao.DriverDao;
import com.movsphere.entity.DriverEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public class DriverDaoImpl implements DriverDao {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public DriverEntity save(DriverEntity driver) {
        if (driver.getId() == null) {
            entityManager.persist(driver);
            return driver;
        } else {
            return entityManager.merge(driver);
        }
    }

    @Override
    public Optional<DriverEntity> findById(Long id) {
        return Optional.ofNullable(entityManager.find(DriverEntity.class, id));
    }

    @Override
    public Optional<DriverEntity> findByUserId(Long userId) {
        try {
            DriverEntity driver = entityManager.createQuery(
                    "SELECT d FROM DriverEntity d WHERE d.user.id = :userId", DriverEntity.class)
                    .setParameter("userId", userId)
                    .getSingleResult();
            return Optional.of(driver);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<DriverEntity> findByUserEmail(String email) {
        try {
            DriverEntity driver = entityManager.createQuery(
                    "SELECT d FROM DriverEntity d WHERE LOWER(d.user.email) = LOWER(:email)", DriverEntity.class)
                    .setParameter("email", email.trim())
                    .getSingleResult();
            return Optional.of(driver);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<DriverEntity> findAvailableDrivers() {
        return entityManager.createQuery(
                "SELECT d FROM DriverEntity d WHERE d.status = 'online' AND d.vehicle IS NOT NULL AND d.vehicle.available = true", DriverEntity.class)
                .getResultList();
    }
}
