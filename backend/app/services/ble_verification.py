import math
from datetime import datetime, timezone
from typing import Tuple


def calculate_estimated_distance(rssi: float, tx_power: float = -59.0, path_loss_exponent: float = 2.2) -> float:
    """
    Calculates estimated distance in meters from RSSI and 1-meter measured TxPower:
    distance = 10 ^ ((TxPower - RSSI) / (10 * n))
    """
    if rssi == 0:
        return -1.0
    
    ratio = (tx_power - rssi) / (10.0 * path_loss_exponent)
    distance = math.pow(10.0, ratio)
    return round(distance, 2)


def verify_proximity(
    rssi: float,
    max_range_meters: float = 15.0,
    rssi_threshold: float = -75.0,
    tx_power: float = -59.0
) -> Tuple[bool, str, float]:
    """
    Validates if student BLE beacon signal meets room proximity criteria.
    """
    estimated_distance = calculate_estimated_distance(rssi, tx_power)
    
    if rssi < rssi_threshold:
        return False, f"BLE signal too weak ({rssi} dBm, min allowed: {rssi_threshold} dBm). Please move closer to the lecturer beacon.", estimated_distance

    if estimated_distance > max_range_meters:
        return False, f"Estimated distance ({estimated_distance}m) exceeds room perimeter limit ({max_range_meters}m).", estimated_distance

    return True, "Proximity confirmed", estimated_distance


def verify_session_token(
    session_rolling_token: str,
    submitted_token: str,
    expires_at: datetime
) -> Tuple[bool, str]:
    """
    Verifies rolling BLE cryptographic token and session expiration.
    """
    now = datetime.now(timezone.utc)
    # Ensure expires_at has timezone info
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        return False, "Attendance session has ended or expired"

    if submitted_token and session_rolling_token and submitted_token != session_rolling_token:
        return False, "Invalid or stale BLE security token. Attendance packet rejected."

    return True, "Token valid"
