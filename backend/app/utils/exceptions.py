from fastapi import HTTPException, status


def not_found(resource: str):
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": f"{resource.upper()}_NOT_FOUND", "message": f"{resource} not found", "detail": None},
    )


def forbidden():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"code": "FORBIDDEN", "message": "Insufficient permissions", "detail": None},
    )


def bad_request(code: str, message: str, detail=None):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"code": code, "message": message, "detail": detail},
    )


def conflict(code: str, message: str):
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={"code": code, "message": message, "detail": None},
    )
