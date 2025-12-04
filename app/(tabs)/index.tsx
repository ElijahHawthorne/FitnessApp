import { StatusBar } from 'expo-status-bar'; // Expo Router often handles StatusBar, but including it is safe
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- CRITICAL CONFIGURATION ---
// 1. Check your IPv4 address using 'ipconfig' in CMD.
// 2. REPLACE THIS PLACEHOLDER with your actual IPv4 Address (e.g., '192.168.1.5')
// If you are running on a simulator/emulator, you can use 'localhost' or '10.0.2.2' (Android emulator special address)
const API_BASE_URL = 'http://10.0.0.78:3000'; 
// ------------------------------

// Exporting the main function component as 'default' is what Expo Router expects
export default function App() { 
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch all workouts from the API
  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/workouts`);
      
      if (!response.ok) {
        // Log the response text if the server returned an error status
        const errorText = await response.text();
        throw new Error(`Server returned status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      setWorkouts(data);
    } catch (err) {
      console.error("Fetch Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to save a new test workout
  const saveTestWorkout = async () => {
    const testWorkout = {
      // Note: userId '123' is hardcoded here and in the server.js for now.
      type: 'Strength',
      durationMinutes: Math.floor(Math.random() * 60) + 30, // 30-90 min
      notes: `Test strength session: ${new Date().toLocaleTimeString()}`,
      exercises: [
        { name: 'Squats', sets: 4, reps: 10, weight: 135 },
        { name: 'Bench Press', sets: 3, reps: 8, weight: 185 },
      ]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testWorkout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save workout. Server response: ${errorText}`);
      }

      // If successful, re-fetch the list to update the display
      console.log("Workout saved successfully!");
      Alert.alert("Success", "Test workout saved!");
      fetchWorkouts();

    } catch (err) {
      console.error("Save Error:", err.message);
      Alert.alert("Error", `Save Error: ${err.message}`); 
    }
  };

  // Fetch data immediately when the component mounts
  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#4F46E5" style={styles.loading} />;
    }

    if (error) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>Connection Error!</Text>
          <Text style={styles.errorDetail}>Is your API server running and is the IP address correct?</Text>
          <Text style={styles.errorDetail}>Details: {error}</Text>
          <TouchableOpacity style={styles.button} onPress={fetchWorkouts}>
            <Text style={styles.buttonText}>Try Connecting Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (workouts.length === 0) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>No workouts found. Click 'Log Test Workout' to add one!</Text>
        </View>
      );
    }

    // Display the list of workouts
    return (
      <ScrollView contentContainerStyle={styles.workoutList}>
        {workouts.map((workout) => (
          <View key={workout._id} style={styles.workoutCard}>
            <Text style={styles.workoutTitle}>{workout.type} Workout</Text>
            <Text>Duration: {workout.durationMinutes} min</Text>
            <Text style={styles.dateText}>Date: {new Date(workout.date).toLocaleDateString()}</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
            {workout.exercises && workout.exercises.length > 0 && (
              <View style={styles.exerciseSection}>
                <Text style={styles.exerciseHeader}>Key Exercises:</Text>
                {workout.exercises.map((ex, index) => (
                  <Text key={index} style={styles.exerciseText}>
                    - {ex.name}: {ex.sets} sets x {ex.reps} reps ({ex.weight} kg)
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Fitness Tracker</Text>
      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.button} onPress={saveTestWorkout}>
            <Text style={styles.buttonText}>Log Test Workout</Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonWrapper: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loading: {
    marginTop: 50,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 10,
  },
  errorDetail: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 5,
  },
  workoutList: {
    paddingBottom: 20,
  },
  workoutCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#4F46E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
    color: '#1F2937',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
    marginBottom: 10,
  },
  notesText: {
    fontStyle: 'italic',
    color: '#4B5563',
    marginBottom: 10,
  },
  exerciseSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  exerciseHeader: {
    fontWeight: '600',
    marginBottom: 5,
    color: '#1F2937',
  },
  exerciseText: {
    fontSize: 14,
    color: '#374151',
  }
});