
import os
import json
from pathlib import Path
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
DATA_DIR = BASE_DIR / "data"
BOOKING_FILE = DATA_DIR / "bookings.json"

DATA_DIR.mkdir(exist_ok=True)

if not BOOKING_FILE.exists():
    BOOKING_FILE.write_text("[]", encoding="utf-8")

app = Flask(
    __name__,
    static_folder=str(PUBLIC_DIR),
    static_url_path=""
)

@app.route("/")
def home():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.route("/api/health")
def health():
    return jsonify({
        "status": "Online",
        "hotel": "Hotel Sahyog"
    })


@app.route("/api/bookings", methods=["POST"])
def create_booking():

    booking = request.get_json(silent=True)

    if not isinstance(booking, dict):
        return jsonify({
            "ok": False,
            "message": "Invalid booking data"
        }), 400

    name = str(booking.get("name", "")).strip()
    phone = str(booking.get("phone", "")).strip()
    checkin = str(booking.get("checkin", "")).strip()
    checkout = str(booking.get("checkout", "")).strip()

    if not all([name, phone, checkin, checkout]):
        return jsonify({
            "ok": False,
            "message": "All fields are required"
        }), 400

    try:
        date_in = datetime.strptime(checkin, "%Y-%m-%d")
        date_out = datetime.strptime(checkout, "%Y-%m-%d")

        if date_out <= date_in:
            raise ValueError("Invalid dates")

    except ValueError:
        return jsonify({
            "ok": False,
            "message": "Please check your dates"
        }), 400

    guests = int(booking.get("guests", 1))

    if guests < 1 or guests > 20:
        return jsonify({
            "ok": False,
            "message": "Invalid guest count"
        }), 400

    new_booking = {
        "name": name,
        "phone": phone,
        "checkin": checkin,
        "checkout": checkout,
        "guests": guests,
        "room": str(booking.get("room", ""))[:80],
        "note": str(booking.get("note", ""))[:500],
        "created_at": datetime.now().isoformat(),
        "status": "New enquiry"
    }

    try:
        bookings = json.loads(
            BOOKING_FILE.read_text(encoding="utf-8")
        )

        bookings.append(new_booking)

        BOOKING_FILE.write_text(
            json.dumps(bookings, indent=4),
            encoding="utf-8"
        )

        return jsonify({
            "ok": True,
            "message": "Booking enquiry received!"
        }), 201

    except (OSError, ValueError):
        return jsonify({
            "ok": False,
            "message": "Server could not save booking"
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )
