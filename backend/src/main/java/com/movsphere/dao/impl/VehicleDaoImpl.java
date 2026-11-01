package com.movsphere.dao.impl;

import com.movsphere.dao.VehicleDao;
import com.movsphere.entity.VehicleEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public class VehicleDaoImpl implements VehicleDao {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public VehicleEntity save(VehicleEntity vehicle) {
        if (vehicle.getId() == null) {
            entityManager.persist(vehicle);
            return vehicle;
        } else {
            return entityManager.merge(vehicle);
        }
    }

    @Override
    public Optional<VehicleEntity> findById(Long id) {
        return Optional.ofNullable(entityManager.find(VehicleEntity.class, id));
    }

    @Override
    public Optional<VehicleEntity> findByVehicleNumber(String vehicleNumber) {
        try {
            VehicleEntity vehicle = entityManager.createQuery(
                    "SELECT v FROM VehicleEntity v WHERE LOWER(v.vehicleNumber) = LOWER(:vehicleNumber)", VehicleEntity.class)
                    .setParameter("vehicleNumber", vehicleNumber.trim())
                    .getSingleResult();
            return Optional.of(vehicle);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }
}
