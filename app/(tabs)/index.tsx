import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- CRITICAL CONFIGURATION ---
// REPLACE THIS PLACEHOLDER with your actual IPv4 Address (e.g., '10.0.0.78')
const API_BASE_URL = 'http://10.0.0.78:3000'; 
// ------------------------------

export default function App() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter(); 

  // Function to fetch all workouts from the API
  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/workouts`);
      
      if (!response.ok) {
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

  // Use useFocusEffect to refresh data every time this screen becomes active
  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
      return () => {};
    }, [fetchWorkouts])
  );

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
          <Text style={styles.messageText}>No workouts found. Click 'Log Workout' to add one!</Text>
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
        {/* Navigation now uses the absolute path /log to break out of the (tabs) group */}
        <TouchableOpacity style={styles.button} onPress={() => router.push('/log')}>
            <Text style={styles.buttonText}>Log New Workout</Text>
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