package com.movsphere.dao.impl;

import com.movsphere.dao.BookingDao;
import com.movsphere.entity.BookingEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public class BookingDaoImpl implements BookingDao {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public BookingEntity save(BookingEntity booking) {
        if (booking.getId() == null) {
            entityManager.persist(booking);
            return booking;
        } else {
            return entityManager.merge(booking);
        }
    }

    @Override
    public Optional<BookingEntity> findById(Long id) {
        return Optional.ofNullable(entityManager.find(BookingEntity.class, id));
    }

    @Override
    public Optional<BookingEntity> findByBookingId(String bookingId) {
        try {
            BookingEntity booking = entityManager.createQuery(
                    "SELECT b FROM BookingEntity b WHERE LOWER(b.bookingId) = LOWER(:bookingId)", BookingEntity.class)
                    .setParameter("bookingId", bookingId.trim())
                    .getSingleResult();
            return Optional.of(booking);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<BookingEntity> findByCustomerId(Long customerId) {
        return entityManager.createQuery(
                "SELECT b FROM BookingEntity b WHERE b.customer.id = :customerId ORDER BY b.createdAt DESC", BookingEntity.class)
                .setParameter("customerId", customerId)
                .getResultList();
    }

    @Override
    public List<BookingEntity> findAvailableJobs() {
        return entityManager.createQuery(
                "SELECT b FROM BookingEntity b WHERE b.status = com.movsphere.entity.BookingStatus.PENDING OR b.status = com.movsphere.entity.BookingStatus.SEARCHING_DRIVER ORDER BY b.createdAt DESC", BookingEntity.class)
                .getResultList();
    }

    @Override
    public List<BookingEntity> findByDriverId(Long driverId) {
        return entityManager.createQuery(
                "SELECT b FROM BookingEntity b WHERE b.driver.id = :driverId ORDER BY b.createdAt DESC", BookingEntity.class)
                .setParameter("driverId", driverId)
                .getResultList();
    }
}
