from fastapi import APIRouter, HTTPException, Query
import httpx

router = APIRouter()

@router.get("")
async def proxy_request(url: str = Query(..., description="Target API URL to fetch")):
    """
    @brief Fetches a remote JSON URL server-side and returns its body, mapping upstream errors to HTTP errors.
    @param url Target API URL to fetch, passed as a query parameter.
    @return The parsed JSON body of the upstream response.
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

