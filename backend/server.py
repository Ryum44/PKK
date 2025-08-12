from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date, timedelta
import os
import jwt
import hashlib
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager

# Environment variables
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
JWT_SECRET = "student_attendance_secret_key_2025"

# Database setup
mongodb_client: AsyncIOMotorClient = None
database = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global mongodb_client, database
    mongodb_client = AsyncIOMotorClient(MONGO_URL)
    database = mongodb_client[DB_NAME]
    
    # Create default teacher and students for testing
    await create_default_data()
    
    yield
    
    # Shutdown
    mongodb_client.close()

app = FastAPI(lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Models
class User(BaseModel):
    username: str
    password: str
    role: str  # teacher, student
    email: str
    full_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class Student(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    student_id: str
    class_id: str
    email: str
    parent_contact: Optional[str] = None

class Class(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    grade: str
    teacher_id: str
    students: List[str] = []

class AttendanceRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    student_name: str
    class_id: str
    date: str
    status: str  # present, absent, late
    notes: Optional[str] = None
    marked_by: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AttendanceRequest(BaseModel):
    class_id: str
    date: str
    attendance_data: List[Dict[str, str]]  # [{"student_id": "123", "status": "present", "notes": ""}]

# Utility functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_jwt_token(user_data: dict) -> str:
    payload = {
        "user_id": user_data["_id"],
        "username": user_data["username"],
        "role": user_data["role"],
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_jwt_token(token)
    user = await database.users.find_one({"_id": payload["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def create_default_data():
    """Create default teacher, classes, and students for testing"""
    
    # Check if data already exists
    existing_user = await database.users.find_one({"username": "teacher1"})
    if existing_user:
        return
    
    # Create default teacher
    teacher_id = str(uuid.uuid4())
    teacher = {
        "_id": teacher_id,
        "username": "teacher1",
        "password": hash_password("password123"),
        "role": "teacher",
        "email": "teacher@school.com",
        "full_name": "Ms. Sarah Johnson"
    }
    await database.users.insert_one(teacher)
    
    # Create default classes
    class_ids = []
    classes_data = [
        {"name": "Math 101", "grade": "Grade 10"},
        {"name": "Science 101", "grade": "Grade 10"},
        {"name": "English 101", "grade": "Grade 9"}
    ]
    
    for class_data in classes_data:
        class_id = str(uuid.uuid4())
        class_ids.append(class_id)
        class_obj = {
            "_id": class_id,
            "name": class_data["name"],
            "grade": class_data["grade"],
            "teacher_id": teacher_id,
            "students": []
        }
        await database.classes.insert_one(class_obj)
    
    # Create default students
    students_data = [
        {"name": "John Smith", "student_id": "ST001", "email": "john@student.com"},
        {"name": "Emma Johnson", "student_id": "ST002", "email": "emma@student.com"},
        {"name": "Michael Brown", "student_id": "ST003", "email": "michael@student.com"},
        {"name": "Sophia Davis", "student_id": "ST004", "email": "sophia@student.com"},
        {"name": "William Wilson", "student_id": "ST005", "email": "william@student.com"},
        {"name": "Olivia Miller", "student_id": "ST006", "email": "olivia@student.com"}
    ]
    
    for i, student_data in enumerate(students_data):
        student_id = str(uuid.uuid4())
        # Assign students to first class (Math 101)
        student = {
            "_id": student_id,
            "name": student_data["name"],
            "student_id": student_data["student_id"],
            "class_id": class_ids[0],
            "email": student_data["email"],
            "parent_contact": f"+1234567890{i}"
        }
        await database.students.insert_one(student)
        
        # Add student to class
        await database.classes.update_one(
            {"_id": class_ids[0]},
            {"$push": {"students": student_id}}
        )
        
        # Create student login account
        student_user = {
            "_id": str(uuid.uuid4()),
            "username": student_data["student_id"].lower(),
            "password": hash_password("student123"),
            "role": "student",
            "email": student_data["email"],
            "full_name": student_data["name"],
            "student_id": student_id
        }
        await database.users.insert_one(student_user)

# API Routes

@app.get("/api/")
async def root():
    return {"message": "Student Attendance System API"}

@app.post("/api/auth/login")
async def login(login_data: UserLogin):
    user = await database.users.find_one({"username": login_data.username})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "username": user["username"],
            "role": user["role"],
            "full_name": user["full_name"],
            "email": user["email"]
        }
    }

@app.get("/api/user/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "username": current_user["username"],
        "role": current_user["role"],
        "full_name": current_user["full_name"],
        "email": current_user["email"]
    }

@app.get("/api/classes")
async def get_classes(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "teacher":
        classes = await database.classes.find({"teacher_id": current_user["_id"]}).to_list(100)
    else:
        # For students, get their class
        student = await database.students.find_one({"_id": current_user.get("student_id")})
        if student:
            classes = await database.classes.find({"_id": student["class_id"]}).to_list(1)
        else:
            classes = []
    
    return classes

@app.get("/api/classes/{class_id}/students")
async def get_class_students(class_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access this")
    
    # Verify teacher owns this class
    class_obj = await database.classes.find_one({"_id": class_id, "teacher_id": current_user["_id"]})
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    students = await database.students.find({"class_id": class_id}).to_list(100)
    return students

@app.post("/api/attendance")
async def mark_attendance(attendance_req: AttendanceRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can mark attendance")
    
    # Verify teacher owns this class
    class_obj = await database.classes.find_one({"_id": attendance_req.class_id, "teacher_id": current_user["_id"]})
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Delete existing attendance for this date and class
    await database.attendance.delete_many({
        "class_id": attendance_req.class_id,
        "date": attendance_req.date
    })
    
    # Insert new attendance records
    attendance_records = []
    for record in attendance_req.attendance_data:
        # Get student details
        student = await database.students.find_one({"_id": record["student_id"]})
        if student:
            attendance_record = {
                "_id": str(uuid.uuid4()),
                "student_id": record["student_id"],
                "student_name": student["name"],
                "class_id": attendance_req.class_id,
                "date": attendance_req.date,
                "status": record["status"],
                "notes": record.get("notes", ""),
                "marked_by": current_user["_id"],
                "timestamp": datetime.utcnow()
            }
            attendance_records.append(attendance_record)
    
    if attendance_records:
        await database.attendance.insert_many(attendance_records)
    
    return {"message": "Attendance marked successfully", "records": len(attendance_records)}

@app.get("/api/attendance/{class_id}")
async def get_attendance(class_id: str, date: str = None, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access this")
    
    query = {"class_id": class_id}
    if date:
        query["date"] = date
    
    attendance_records = await database.attendance.find(query).to_list(1000)
    return attendance_records

@app.get("/api/student/attendance")
async def get_student_attendance(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can access this")
    
    # Get student details
    student = await database.students.find_one({"_id": current_user.get("student_id")})
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
    
    # Get attendance records
    attendance_records = await database.attendance.find({"student_id": student["_id"]}).sort("date", -1).to_list(1000)
    
    # Calculate statistics
    total_days = len(attendance_records)
    present_days = len([r for r in attendance_records if r["status"] == "present"])
    absent_days = len([r for r in attendance_records if r["status"] == "absent"])
    late_days = len([r for r in attendance_records if r["status"] == "late"])
    
    attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 0
    
    return {
        "student": student,
        "attendance_records": attendance_records,
        "statistics": {
            "total_days": total_days,
            "present_days": present_days,
            "absent_days": absent_days,
            "late_days": late_days,
            "attendance_percentage": round(attendance_percentage, 1)
        }
    }

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "teacher":
        # Get teacher's classes
        classes = await database.classes.find({"teacher_id": current_user["_id"]}).to_list(100)
        class_ids = [c["_id"] for c in classes]
        
        # Get recent attendance
        today = datetime.now().strftime("%Y-%m-%d")
        recent_attendance = await database.attendance.find({
            "class_id": {"$in": class_ids},
            "date": today
        }).to_list(1000)
        
        # Calculate stats
        total_students = await database.students.count_documents({"class_id": {"$in": class_ids}})
        present_today = len([r for r in recent_attendance if r["status"] == "present"])
        absent_today = len([r for r in recent_attendance if r["status"] == "absent"])
        
        return {
            "total_classes": len(classes),
            "total_students": total_students,
            "present_today": present_today,
            "absent_today": absent_today,
            "attendance_marked_today": len(recent_attendance) > 0
        }
    
    else:  # student
        # Get student attendance stats
        student = await database.students.find_one({"_id": current_user.get("student_id")})
        if not student:
            return {"error": "Student record not found"}
        
        attendance_records = await database.attendance.find({"student_id": student["_id"]}).to_list(1000)
        total_days = len(attendance_records)
        present_days = len([r for r in attendance_records if r["status"] == "present"])
        
        return {
            "total_days": total_days,
            "present_days": present_days,
            "attendance_percentage": round((present_days / total_days * 100) if total_days > 0 else 0, 1)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)