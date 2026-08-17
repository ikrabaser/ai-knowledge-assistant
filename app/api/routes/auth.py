"""Authentication endpoints: register, login, current-user lookup."""
from fastapi import APIRouter, Depends

from app.api.dependencies import get_auth_service, get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Create a new user account and return an access token."""
    _, token = await auth_service.register(email=request.email, password=request.password)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Authenticate with email/password and return an access token."""
    _, token = await auth_service.login(email=request.email, password=request.password)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return the currently authenticated user."""
    return UserResponse.model_validate(current_user)
