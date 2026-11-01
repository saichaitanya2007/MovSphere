# 1. Register shipper
$shipperBody = '{"name":"Test Shipper","email":"shipper_test@movsphere.com","phone":"+910000000001","password":"test123","role":"SHIPPER"}'
$shipperRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -ContentType "application/json" -Body $shipperBody
Write-Output "SHIPPER ID: $($shipperRes.id)"

# 2. Register driver
$driverBody = '{"name":"Test Driver","email":"driver_test@movsphere.com","phone":"+910000000002","password":"test123","role":"DRIVER"}'
$driverRes = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -ContentType "application/json" -Body $driverBody
Write-Output "DRIVER ID: $($driverRes.id)"

# 3. Onboard driver
$token = $driverRes.token
$onboardBody = '{"vehicleType":"Sedan","vehicleNumber":"TS09AB4521","vehicleCapacity":"4 passengers","experienceYears":5,"workType":"ride-booking","licenseFileName":"license.pdf","licenseFileSize":204800}'
$onboardHeaders = @{ Authorization = "Bearer $token" }
$onboardRes = Invoke-RestMethod -Uri "http://localhost:8080/api/drivers/onboard" -Method POST -ContentType "application/json" -Headers $onboardHeaders -Body $onboardBody
Write-Output "DRIVER ONBOARDED: id=$($onboardRes.id) type=$($onboardRes.vehicle.vehicleType) exp=$($onboardRes.experienceYears) workType=$($onboardRes.workType)"

# 4. Create booking as shipper
$shipperToken = $shipperRes.token
$shipperHeaders = @{ Authorization = "Bearer $shipperToken" }
$bookingBody = '{"riderName":"Riya Malhotra","pickupLabel":"Airport","pickupLatitude":17.2403,"pickupLongitude":78.4294,"destinationLabel":"HITEC City","destinationLatitude":17.4435,"destinationLongitude":78.3772,"vehicleType":"Sedan","distanceKm":30.2,"totalPrice":1500,"pickupWindow":"Today 7PM","notes":"Test booking","passengers":2}'
$bookingRes = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings" -Method POST -ContentType "application/json" -Headers $shipperHeaders -Body $bookingBody
Write-Output "BOOKING CREATED: id=$($bookingRes.id) status=$($bookingRes.status)"

# 5. Driver fetches jobs
$driverHeaders = @{ Authorization = "Bearer $token" }
$jobs = Invoke-RestMethod -Uri "http://localhost:8080/api/driver/jobs" -Method GET -Headers $driverHeaders
Write-Output "JOBS FOUND: $($jobs.Count)"
if ($jobs.Count -gt 0) { Write-Output "FIRST JOB: id=$($jobs[0].id) status=$($jobs[0].status)" }
