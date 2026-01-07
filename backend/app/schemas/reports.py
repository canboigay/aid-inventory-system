"""Reports schemas."""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ActivitySummary(BaseModel):
    """Summary statistics for activity report."""
    period: str
    date_from: datetime
    date_to: datetime
    total_productions: int
    total_purchases: int
    total_distributions: int
    total_assemblies: int
    total_items_distributed: int
    unique_users: int


class UserActivity(BaseModel):
    """User activity summary."""
    user_name: str
    productions_count: int
    purchases_count: int
    distributions_count: int
    assemblies_count: int
    total_entries: int


class ProductionSummary(BaseModel):
    """Production activity summary."""
    id: str
    date: datetime
    item_name: str
    quantity: float
    user_name: str
    notes: Optional[str] = None


class PurchaseSummary(BaseModel):
    """Purchase activity summary."""
    id: str
    date: datetime
    supplier_name: Optional[str] = None
    items: List[dict]
    total_cost: Optional[float] = None
    user_name: str
    notes: Optional[str] = None


class DistributionSummary(BaseModel):
    """Distribution activity summary."""
    id: str
    date: datetime
    distribution_type: str
    distribution_type_legacy: Optional[str] = None
    items: List[dict]
    recipient_info: Optional[str] = None
    user_name: str
    notes: Optional[str] = None


class AssemblySummary(BaseModel):
    """Kit assembly summary."""
    id: str
    date: datetime
    kit_name: str
    quantity_assembled: float
    components: List[dict]
    user_name: str
    notes: Optional[str] = None


class ComprehensiveReport(BaseModel):
    """Comprehensive activity report."""
    summary: ActivitySummary
    user_activities: List[UserActivity]
    productions: List[ProductionSummary]
    purchases: List[PurchaseSummary]
    distributions: List[DistributionSummary]
    assemblies: List[AssemblySummary]
