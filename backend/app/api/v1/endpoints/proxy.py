from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter()

@router.get("")
async def proxy_request(url: str = Query(..., description="Target API URL to fetch")):
    """
    Bypass browser CORS restrictions for external APIs like Steam, GitHub, etc.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Upstream error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Proxy request failed: {str(e)}")

