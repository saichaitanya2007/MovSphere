package com.movsphere.service.impl;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.movsphere.dao.BookingDao;
import com.movsphere.dao.DriverDao;
import com.movsphere.dao.UserDao;
import com.movsphere.dto.BookingRequest;
import com.movsphere.dto.BookingResponse;
import com.movsphere.dto.DriverResponse;
import com.movsphere.dto.VehicleResponse;
import com.movsphere.entity.BookingEntity;
import com.movsphere.entity.BookingStatus;
import com.movsphere.entity.DriverEntity;
import com.movsphere.entity.UserEntity;
import com.movsphere.entity.UserRole;
import com.movsphere.entity.VehicleEntity;
import com.movsphere.exception.DriverUnavailableException;
import com.movsphere.exception.InvalidStatusTransitionException;
import com.movsphere.exception.ResourceNotFoundException;
import com.movsphere.exception.UnauthorizedAccessException;
import com.movsphere.service.BookingService;

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingDao bookingDao;
    private final UserDao userDao;
    private final DriverDao driverDao;
    private final Random random = new Random();

    public BookingServiceImpl(BookingDao bookingDao, UserDao userDao, DriverDao driverDao) {
        this.bookingDao = bookingDao;
        this.userDao = userDao;
        this.driverDao = driverDao;
    }

    @Override
    @Transactional
    public BookingResponse createBooking(String customerEmail, BookingRequest request) {
        UserEntity customer = userDao.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with email: " + customerEmail));

        // Validate booking input
        if (request.getDistanceKm() <= 0) {
            throw new IllegalArgumentException("Distance must be greater than zero");
        }
        if (request.getTotalPrice() <= 0) {
            throw new IllegalArgumentException("Price must be positive");
        }
        if (request.getPassengers() <= 0) {
            throw new IllegalArgumentException("Passengers must be at least 1");
        }

        BookingEntity booking = new BookingEntity();
        booking.setBookingId("REQ-" + (100000 + random.nextInt(900000)));
        booking.setCustomer(customer);
        booking.setRiderName(request.getRiderName());
        booking.setPickupLabel(request.getPickupLabel());
        booking.setPickupLatitude(request.getPickupLatitude());
        booking.setPickupLongitude(request.getPickupLongitude());
        booking.setDestinationLabel(request.getDestinationLabel());
        booking.setDestinationLatitude(request.getDestinationLatitude());
        booking.setDestinationLongitude(request.getDestinationLongitude());
        booking.setVehicleType(request.getVehicleType() == null || request.getVehicleType().isBlank() ? "Any vehicle" : request.getVehicleType());
        booking.setDistanceKm(request.getDistanceKm());
        booking.setTotalPrice(request.getTotalPrice());
        booking.setPickupWindow(request.getPickupWindow());
        booking.setNotes(request.getNotes());
        booking.setPassengers(request.getPassengers());
        booking.setStatus(BookingStatus.SEARCHING_DRIVER); // Initial status: searching for a driver

        BookingEntity savedBooking = bookingDao.save(booking);
        return mapToResponse(savedBooking);
    }

    @Override
    public List<BookingResponse> getMyBookings(String userEmail) {
        UserEntity user = userDao.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        List<BookingEntity> bookings;
        if (user.getRole() == UserRole.DRIVER) {
            DriverEntity driver = driverDao.findByUserEmail(userEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found"));
            bookings = bookingDao.findByDriverId(driver.getId());
        } else {
            bookings = bookingDao.findByCustomerId(user.getId());
        }

        return bookings.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public BookingResponse getBookingById(Long id, String userEmail) {
        BookingEntity booking = bookingDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        UserEntity user = userDao.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        // Authorization check: User must be either customer, driver, or admin
        if (user.getRole() != UserRole.ADMIN && 
            !booking.getCustomer().getId().equals(user.getId()) &&
            (booking.getDriver() == null || !booking.getDriver().getUser().getId().equals(user.getId()))) {
            throw new UnauthorizedAccessException("You are not authorized to view this booking.");
        }

        return mapToResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long id, String userEmail) {
        BookingEntity booking = bookingDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        UserEntity user = userDao.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        if (!booking.getCustomer().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new UnauthorizedAccessException("You are not authorized to cancel this booking.");
        }

        // Validate booking status can transition to CANCELLED
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new InvalidStatusTransitionException("Cannot cancel a booking that is already completed or cancelled.");
        }

        booking.setStatus(BookingStatus.CANCELLED);

        // Free up assigned driver and vehicle
        if (booking.getDriver() != null) {
            DriverEntity driver = booking.getDriver();
            driver.setStatus("online");
            if (driver.getVehicle() != null) {
                driver.getVehicle().setAvailable(true);
            }
            driverDao.save(driver);
        }

        BookingEntity savedBooking = bookingDao.save(booking);
        return mapToResponse(savedBooking);
    }

    @Override
    public List<BookingResponse> getAvailableJobsForDriver(String driverEmail) {
        // Ensure user is driver
        DriverEntity driver = driverDao.findByUserEmail(driverEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found for user: " + driverEmail));

        List<BookingEntity> availableJobs = bookingDao.findAvailableJobs();

        return availableJobs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponse acceptJob(String bookingReference, String driverEmail) {
        DriverEntity driver = driverDao.findByUserEmail(driverEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found for user: " + driverEmail));

        BookingEntity booking = findBookingByReference(bookingReference);

        // Check if driver has an active trip already
        List<BookingEntity> activeTrips = bookingDao.findByDriverId(driver.getId());
        for (BookingEntity active : activeTrips) {
            if (active.getStatus() != BookingStatus.COMPLETED && active.getStatus() != BookingStatus.CANCELLED) {
                throw new DriverUnavailableException("Driver is currently on another active trip and cannot accept a new job.");
            }
        }

        // Acceptance validation
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new InvalidStatusTransitionException("Cannot accept a completed or cancelled booking.");
        }
        if (booking.getDriver() != null && !booking.getDriver().getId().equals(driver.getId())) {
            throw new DriverUnavailableException("This job is already assigned to another driver.");
        }

        booking.setDriver(driver);
        booking.setVehicle(driver.getVehicle());
        booking.setStatus(BookingStatus.ACCEPTED);

        // Update driver's status to on-trip
        driver.setStatus("on-trip");
        if (driver.getVehicle() != null) {
            driver.getVehicle().setAvailable(false);
        }
        driverDao.save(driver);

        BookingEntity savedBooking = bookingDao.save(booking);
        return mapToResponse(savedBooking);
    }

    private BookingEntity findBookingByReference(String bookingReference) {
        if (bookingReference == null || bookingReference.isBlank()) {
            throw new ResourceNotFoundException("Booking reference is required.");
        }

        String reference = bookingReference.trim();
        try {
            return bookingDao.findById(Long.parseLong(reference))
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + reference));
        } catch (NumberFormatException ignored) {
            return bookingDao.findByBookingId(reference)
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found with reference: " + reference));
        }
    }

    @Override
    @Transactional
    public BookingResponse rejectJob(Long id, String driverEmail) {
        DriverEntity driver = driverDao.findByUserEmail(driverEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found for user: " + driverEmail));

        BookingEntity booking = bookingDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        if (booking.getDriver() == null || !booking.getDriver().getId().equals(driver.getId())) {
            throw new IllegalArgumentException("This booking is not assigned to you.");
        }

        // Revert to searching status and clear driver association
        booking.setDriver(null);
        booking.setVehicle(null);
        booking.setStatus(BookingStatus.SEARCHING_DRIVER);
        driver.setStatus("online");
        if (driver.getVehicle() != null) {
            driver.getVehicle().setAvailable(true);
        }
        driverDao.save(driver);

        BookingEntity savedBooking = bookingDao.save(booking);
        return mapToResponse(savedBooking);
    }

    @Override
    @Transactional
    public BookingResponse updateBookingStage(Long id, String status, String driverEmail) {
        DriverEntity driver = driverDao.findByUserEmail(driverEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found for user: " + driverEmail));

        BookingEntity booking = bookingDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        if (booking.getDriver() == null || !booking.getDriver().getId().equals(driver.getId())) {
            throw new UnauthorizedAccessException("You are not authorized to update this booking.");
        }

        BookingStatus nextStatus;
        try {
            nextStatus = BookingStatus.valueOf(status.toUpperCase().replace("-", "_"));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid status value: " + status);
        }

        // Validate lifecycle transitions
        validateTransition(booking.getStatus(), nextStatus);

        booking.setStatus(nextStatus);

        // If completed, update driver and vehicle status
        if (nextStatus == BookingStatus.COMPLETED) {
            driver.setStatus("online");
            if (driver.getVehicle() != null) {
                driver.getVehicle().setAvailable(true);
            }
            driver.setTotalTrips(driver.getTotalTrips() + 1);
            driverDao.save(driver);
        }

        BookingEntity savedBooking = bookingDao.save(booking);
        return mapToResponse(savedBooking);
    }

    private void validateTransition(BookingStatus current, BookingStatus next) {
        if (current == next) return;

        boolean valid = false;
        switch (current) {
            case PENDING:
            case SEARCHING_DRIVER:
                valid = (next == BookingStatus.DRIVER_ASSIGNED || next == BookingStatus.ACCEPTED || next == BookingStatus.CANCELLED);
                break;
            case DRIVER_ASSIGNED:
                valid = (next == BookingStatus.ACCEPTED || next == BookingStatus.SEARCHING_DRIVER || next == BookingStatus.CANCELLED);
                break;
            case ACCEPTED:
                valid = (next == BookingStatus.HEADING_TO_PICKUP || next == BookingStatus.CANCELLED);
                break;
            case HEADING_TO_PICKUP:
                valid = (next == BookingStatus.ARRIVED_AT_PICKUP || next == BookingStatus.CANCELLED);
                break;
            case ARRIVED_AT_PICKUP:
                valid = (next == BookingStatus.PASSENGER_ONBOARD || next == BookingStatus.CANCELLED);
                break;
            case PASSENGER_ONBOARD:
                valid = (next == BookingStatus.TRIP_STARTED || next == BookingStatus.CANCELLED);
                break;
            case TRIP_STARTED:
                valid = (next == BookingStatus.COMPLETED || next == BookingStatus.CANCELLED);
                break;
            case COMPLETED:
            case CANCELLED:
                valid = false; // Terminal states
                break;
        }

        if (!valid) {
            throw new InvalidStatusTransitionException("Cannot transition booking status from " + current + " to " + next);
        }
    }

    private BookingResponse mapToResponse(BookingEntity booking) {
        BookingResponse r = new BookingResponse();
        r.setId(booking.getId());
        r.setBookingId(booking.getBookingId());
        r.setCustomerId(booking.getCustomer().getId());
        r.setCustomerName(booking.getCustomer().getName());
        r.setRiderName(booking.getRiderName());
        r.setPickupLabel(booking.getPickupLabel());
        r.setPickupLatitude(booking.getPickupLatitude());
        r.setPickupLongitude(booking.getPickupLongitude());
        r.setDestinationLabel(booking.getDestinationLabel());
        r.setDestinationLatitude(booking.getDestinationLatitude());
        r.setDestinationLongitude(booking.getDestinationLongitude());
        r.setVehicleType(booking.getVehicleType());
        r.setDistanceKm(booking.getDistanceKm());
        r.setTotalPrice(booking.getTotalPrice());
        r.setStatus(booking.getStatus().name());
        r.setPickupWindow(booking.getPickupWindow());
        r.setNotes(booking.getNotes());
        r.setPassengers(booking.getPassengers());
        r.setCreatedAt(booking.getCreatedAt().toString());
        r.setUpdatedAt(booking.getUpdatedAt().toString());

        if (booking.getVehicle() != null) {
            VehicleEntity v = booking.getVehicle();
            r.setVehicle(new VehicleResponse(v.getId(), v.getVehicleNumber(), v.getVehicleType(), v.getCapacity(), v.isAvailable()));
        }

        if (booking.getDriver() != null) {
            DriverEntity d = booking.getDriver();
            VehicleResponse vr = null;
            if (d.getVehicle() != null) {
                VehicleEntity v = d.getVehicle();
                vr = new VehicleResponse(v.getId(), v.getVehicleNumber(), v.getVehicleType(), v.getCapacity(), v.isAvailable());
            }
            r.setDriver(new DriverResponse(
                    d.getId(),
                    d.getUser().getId(),
                    d.getUser().getName(),
                    d.getUser().getEmail(),
                    d.getUser().getPhone(),
                    d.getStatus(),
                    d.getRating(),
                    d.getTotalTrips(),
                    vr,
                    d.getLicenseFileName()
            ));
        }

        return r;
    }
}
