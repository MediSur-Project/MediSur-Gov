from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
import ssl
import certifi
import geopy.geocoders
from urllib.request import urlopen
import urllib3

# Configure urllib3 to use the certifi certificate bundle
urllib3.disable_warnings()
geopy.geocoders.options.default_ssl_context = ssl.create_default_context(cafile=certifi.where())

def get_coordinates(address: str) -> tuple[float, float] | None:
    """
    Extract latitude and longitude coordinates from a given address.
    
    Args:
        address (str): The address to geocode
        
    Returns:
        tuple[float, float] | None: A tuple containing (latitude, longitude) if found,
                                   None if the address couldn't be geocoded
    """
    try:
        print(f"Searching for address: {address}")
        # Initialize the geocoder with a meaningful user agent and proper SSL context
        geolocator = Nominatim(
            user_agent="medisur_gov_app",
            scheme='https',
            timeout=10
        )
        
        # Get location information
        location = geolocator.geocode(
            address,
            exactly_one=True,
            addressdetails=True,
            language="es"
        )
        
        print(f"Location found: {location}")
        
        if location:
            return (location.latitude, location.longitude)
        return None
        
    except (GeocoderTimedOut, GeocoderUnavailable) as e:
        # Log the error in production
        print(f"Error geocoding address: {str(e)}")
        return None
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return None
