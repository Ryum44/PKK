import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { Calendar } from './components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  School, 
  Users, 
  Calendar as CalendarIcon,
  BookOpen,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  User,
  LogOut
} from 'lucide-react';
import './App.css';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login states
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // Teacher states
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [dashboardStats, setDashboardStats] = useState({});

  // Student states
  const [studentAttendance, setStudentAttendance] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API_BASE}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      fetchDashboardData(token);
    } catch (error) {
      localStorage.removeItem('token');
      setError('Session expired. Please login again.');
    }
  };

  const fetchDashboardData = async (token) => {
    try {
      const [classesRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/classes`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setClasses(classesRes.data);
      setDashboardStats(statsRes.data);

      // If student, fetch attendance data
      if (statsRes.data.total_days !== undefined) {
        const attendanceRes = await axios.get(`${API_BASE}/api/student/attendance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudentAttendance(attendanceRes.data);
      }
    } catch (error) {
      setError('Failed to fetch dashboard data');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, loginData);
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setUser(userData);
      setSuccess('Login successful!');
      fetchDashboardData(access_token);
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setClasses([]);
    setStudents([]);
    setAttendanceData({});
    setStudentAttendance(null);
    setSelectedClass('');
    setSuccess('Logged out successfully!');
  };

  const fetchClassStudents = async (classId) => {
    if (!classId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStudents(response.data);
      
      // Initialize attendance data for each student
      const initialAttendance = {};
      response.data.forEach(student => {
        initialAttendance[student._id] = { status: 'present', notes: '' };
      });
      setAttendanceData(initialAttendance);
      
      // Check if attendance already marked for selected date
      const dateStr = attendanceDate.toISOString().split('T')[0];
      const attendanceRes = await axios.get(`${API_BASE}/api/attendance/${classId}?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (attendanceRes.data.length > 0) {
        const existingAttendance = {};
        attendanceRes.data.forEach(record => {
          existingAttendance[record.student_id] = {
            status: record.status,
            notes: record.notes || ''
          };
        });
        setAttendanceData(existingAttendance);
      }
    } catch (error) {
      setError('Failed to fetch students');
    }
  };

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const submitAttendance = async () => {
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const dateStr = attendanceDate.toISOString().split('T')[0];
      
      const attendanceArray = Object.entries(attendanceData).map(([studentId, data]) => ({
        student_id: studentId,
        status: data.status,
        notes: data.notes
      }));

      await axios.post(`${API_BASE}/api/attendance`, {
        class_id: selectedClass,
        date: dateStr,
        attendance_data: attendanceArray
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Attendance marked successfully!');
      fetchDashboardData(token);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, show login form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <School className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Student Attendance</CardTitle>
            <CardDescription>Sign in to manage or view attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>
              
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Demo Credentials:</p>
              <p className="text-xs text-gray-500">Teacher: <code>teacher1</code> / <code>password123</code></p>
              <p className="text-xs text-gray-500">Student: <code>st001</code> / <code>student123</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Teacher Dashboard
  if (user.role === 'teacher') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <School className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Teacher Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user.full_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {user.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Classes</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.total_classes || 0}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.total_students || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present Today</p>
                    <p className="text-2xl font-bold text-green-600">{dashboardStats.present_today || 0}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent Today</p>
                    <p className="text-2xl font-bold text-red-600">{dashboardStats.absent_today || 0}</p>
                  </div>
                  <UserX className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Marking Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Mark Attendance</span>
              </CardTitle>
              <CardDescription>Select a class and date to mark student attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="class-select">Select Class</Label>
                  <Select value={selectedClass} onValueChange={(value) => {
                    setSelectedClass(value);
                    fetchClassStudents(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.name} - {cls.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Select Date</Label>
                  <div className="mt-1">
                    <Input
                      type="date"
                      value={attendanceDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        setAttendanceDate(new Date(e.target.value));
                        if (selectedClass) {
                          fetchClassStudents(selectedClass);
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={submitAttendance} 
                    disabled={!selectedClass || students.length === 0 || loading}
                    className="w-full"
                  >
                    {loading ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </div>
              </div>

              {/* Student List */}
              {students.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Students ({students.length})</h3>
                  <div className="grid gap-4">
                    {students.map((student) => (
                      <div key={student._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-gray-100">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">ID: {student.student_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant={attendanceData[student._id]?.status === 'present' ? 'default' : 'outline'}
                              onClick={() => handleAttendanceChange(student._id, 'status', 'present')}
                              className="text-xs"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant={attendanceData[student._id]?.status === 'late' ? 'default' : 'outline'}
                              onClick={() => handleAttendanceChange(student._id, 'status', 'late')}
                              className="text-xs bg-yellow-500 hover:bg-yellow-600"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Late
                            </Button>
                            <Button
                              size="sm"
                              variant={attendanceData[student._id]?.status === 'absent' ? 'destructive' : 'outline'}
                              onClick={() => handleAttendanceChange(student._id, 'status', 'absent')}
                              className="text-xs"
                            >
                              <UserX className="h-3 w-3 mr-1" />
                              Absent
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mt-4 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Student Dashboard
  if (user.role === 'student' && studentAttendance) {
    const { student, attendance_records, statistics } = studentAttendance;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Student Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user.full_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback className="bg-green-100 text-green-600">
                  {user.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Attendance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.attendance_percentage}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present Days</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.present_days}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Late Days</p>
                    <p className="text-2xl font-bold text-yellow-600">{statistics.late_days}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent Days</p>
                    <p className="text-2xl font-bold text-red-600">{statistics.absent_days}</p>
                  </div>
                  <UserX className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Attendance History</span>
              </CardTitle>
              <CardDescription>Your complete attendance record</CardDescription>
            </CardHeader>
            <CardContent>
              {attendance_records.length > 0 ? (
                <div className="space-y-3">
                  {attendance_records.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <span className="font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            record.status === 'present' ? 'default' : 
                            record.status === 'late' ? 'secondary' : 'destructive'
                          }
                          className={
                            record.status === 'present' ? 'bg-green-100 text-green-700 border-green-200' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {record.status === 'present' && <UserCheck className="h-3 w-3 mr-1" />}
                          {record.status === 'late' && <Clock className="h-3 w-3 mr-1" />}
                          {record.status === 'absent' && <UserX className="h-3 w-3 mr-1" />}
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                        {record.notes && (
                          <span className="text-sm text-gray-500">({record.notes})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No attendance records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}

export default App;