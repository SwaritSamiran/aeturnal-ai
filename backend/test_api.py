import requests
import json
from typing import Optional

# Configuration
BASE_URL = "http://localhost:8000"
SCAN_ENDPOINT = f"{BASE_URL}/api/scan"

# Test data
test_cases = [
    {
        "name": "Healthy Food - Apple",
        "food_item": "Apple",
        "user_context": {
            "username": "TestUser1",
            "selectedClass": "Warrior",
            "weight": "75",
            "height": "180",
            "age": "25",
            "medicalHistory": "None",
            "dailyActivity": "High - Intense Gym",
        },
    },
    {
        "name": "Unhealthy Food - Fast Food Burger",
        "food_item": "Fast Food Burger with Fries",
        "user_context": {
            "username": "TestUser2",
            "selectedClass": "Monk",
            "weight": "85",
            "height": "175",
            "age": "30",
            "medicalHistory": "High Blood Pressure",
            "dailyActivity": "Low - Sedentary Work",
        },
    },
    {
        "name": "Sugary Drink - Soda",
        "food_item": "Cola Soda",
        "user_context": {
            "username": "TestUser3",
            "selectedClass": "Scholar",
            "weight": "70",
            "height": "170",
            "age": "22",
            "medicalHistory": "Diabetes",
            "dailyActivity": "Moderate - Office Work",
        },
    },
    {
        "name": "Protein Source - Chicken Breast",
        "food_item": "Grilled Chicken Breast",
        "user_context": {
            "username": "TestUser4",
            "selectedClass": "Athlete",
            "weight": "80",
            "height": "185",
            "age": "28",
            "medicalHistory": "None",
            "dailyActivity": "Very High - Professional Athlete",
        },
    },
    {
        "name": "Caffeinated Drink at Night - Monster Energy",
        "food_item": "Monster Energy Drink at 12 AM",
        "user_context": {
            "username": "TestUser5",
            "selectedClass": "Scholar",
            "weight": "75",
            "height": "178",
            "age": "20",
            "medicalHistory": "Anxiety",
            "dailyActivity": "High - Night Study",
        },
    },
]


def test_scan_endpoint(food_item: str, user_context: dict) -> Optional[dict]:
    """
    Test the /api/scan endpoint

    Args:
        food_item: The food item to scan
        user_context: User context dictionary

    Returns:
        JSON response or None if request failed
    """
    payload = {"food_item": food_item, "user_context": user_context}

    try:
        response = requests.post(SCAN_ENDPOINT, json=payload, timeout=30)

        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: Status Code {response.status_code}")
            print(f"Response: {response.text}")
            return None

    except requests.exceptions.ConnectionError:
        print(f"Connection Error: Could not connect to {SCAN_ENDPOINT}")
        print(
            "Make sure the backend server is running (python -m uvicorn backend.main:app --reload)"
        )
        return None
    except requests.exceptions.Timeout:
        print("Timeout Error: Request took too long")
        return None
    except Exception as e:
        print(f"Error: {str(e)}")
        return None


def print_result(test_name: str, result: Optional[dict]) -> None:
    """Pretty print the test result"""
    print("\n" + "=" * 80)
    print(f"TEST: {test_name}")
    print("=" * 80)

    if result is None:
        print("❌ FAILED - No response received")
        return

    try:
        print("✅ SUCCESS\n")
        print("Response:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"❌ Error parsing response: {str(e)}")
        print(f"Raw response: {result}")


def main():
    """Run all test cases"""
    print("\n")
    print("*" * 80)
    print("AETURNUS-AI HEALTH ORACLE API TEST SUITE")
    print("*" * 80)

    for test_case in test_cases:
        print(f"\nTesting: {test_case['name']}")
        print(f"Food Item: {test_case['food_item']}")
        print(
            f"User: {test_case['user_context']['username']} - Class: {test_case['user_context']['selectedClass']}"
        )

        result = test_scan_endpoint(test_case["food_item"], test_case["user_context"])

        print_result(test_case["name"], result)

    print("\n" + "*" * 80)
    print("TEST SUITE COMPLETED")
    print("*" * 80 + "\n")


if __name__ == "__main__":
    main()
