import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// --- CRITICAL CONFIGURATION ---
const API_BASE_URL = 'http://10.0.0.78:3000'; // Ensure this IP is correct
// ------------------------------

const initialFormState = {
    type: 'Strength',
    durationMinutes: '',
    notes: '',
    loggedExercises: [], 
};

export default function LogWorkoutScreen() {
    const [form, setForm] = useState(initialFormState);
    const [availableExercises, setAvailableExercises] = useState([]);
    const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingExercises, setIsLoadingExercises] = useState(true);
    const router = useRouter();

    const muscleGroupOptions = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

    // --- Data Fetching Logic ---
    const fetchExercises = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/exercises`);
            if (!response.ok) throw new Error(`Server returned status ${response.status}`);
            const data = await response.json();
            setAvailableExercises(data);
        } catch (err) {
            Alert.alert("Error", `Failed to load exercises: ${err.message}`);
        } finally {
            setIsLoadingExercises(false);
        }
    };

    useEffect(() => {
        fetchExercises();
    }, []);

    // --- Handlers ---
    const handleChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleMuscleGroup = (group) => {
        setSelectedMuscleGroups(prev => 
            prev.includes(group)
                ? prev.filter(g => g !== group)
                : [...prev, group]
        );
    };

    const addSuggestedExercise = (exerciseName) => {
        // Prevent adding duplicates
        if (form.loggedExercises.some(ex => ex.name === exerciseName)) {
            Alert.alert("Already Added", `${exerciseName} is already in your workout log.`);
            return;
        }

        // Add the exercise with default (empty) values for sets/reps
        setForm(prev => ({
            ...prev,
            loggedExercises: [
                ...prev.loggedExercises,
                { name: exerciseName, sets: '3', reps: '10', weight: '0' } 
            ]
        }));
    };

    const updateLoggedExercise = (index, field, value) => {
        const newLoggedExercises = [...form.loggedExercises];
        newLoggedExercises[index][field] = value;
        setForm(prev => ({ ...prev, loggedExercises: newLoggedExercises }));
    };

    const removeLoggedExercise = (index) => {
        const newLoggedExercises = form.loggedExercises.filter((_, i) => i !== index);
        setForm(prev => ({ ...prev, loggedExercises: newLoggedExercises }));
    };

    // --- Filtering Logic ---
    // Filters the full list of exercises down to those whose muscleGroup
    // matches any of the currently selected muscle groups.
    const suggestedExercises = availableExercises.filter(ex => 
        selectedMuscleGroups.includes(ex.muscleGroup)
    ).slice(0, 5); // Limit suggestions to 5

    // --- Submission ---
    const handleSaveWorkout = async () => {
        // Basic validation
        if (!form.durationMinutes || form.loggedExercises.length === 0) {
            Alert.alert("Missing Fields", "Please enter duration and log at least one exercise.");
            return;
        }

        setIsSaving(true);

        const workoutPayload = {
            userId: '123',
            type: form.type,
            durationMinutes: parseInt(form.durationMinutes, 10),
            date: new Date().toISOString(),
            notes: form.notes,
            // Map the logged string values to numbers for the API
            exercises: form.loggedExercises.map(ex => ({
                name: ex.name,
                sets: parseInt(ex.sets || 0, 10),
                reps: parseInt(ex.reps || 0, 10),
                weight: parseFloat(ex.weight || 0),
            }))
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/workouts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workoutPayload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save workout. Server response: ${response.status} - ${errorText}`);
            }

            Alert.alert("Success!", "Your workout has been logged.");
            setForm(initialFormState); 
            router.back(); 

        } catch (err) {
            console.error("Save Error:", err.message);
            Alert.alert("Error", `Could not save workout: ${err.message}`); 
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingExercises) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading Exercises...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.header}>Log New Workout</Text>

            {/* General Details */}
            <Text style={styles.label}>Workout Type</Text>
            <View style={styles.typeSelector}>
                {['Strength', 'Cardio', 'Flexibility'].map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.typeButton,
                            form.type === type && styles.typeButtonActive
                        ]}
                        onPress={() => handleChange('type', type)}
                        disabled={isSaving}
                    >
                        <Text style={[
                            styles.typeButtonText,
                            form.type === type && styles.typeButtonTextActive
                        ]}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g., 45"
                keyboardType="numeric"
                value={form.durationMinutes}
                onChangeText={(text) => handleChange('durationMinutes', text)}
                disabled={isSaving}
            />

            {/* Muscle Group Selection */}
            <Text style={styles.subHeader}>1. Select Target Muscle Groups</Text>
            <View style={styles.muscleGroupContainer}>
                {muscleGroupOptions.map(group => (
                    <TouchableOpacity
                        key={group}
                        style={[
                            styles.muscleGroupButton,
                            selectedMuscleGroups.includes(group) && styles.muscleGroupButtonActive
                        ]}
                        onPress={() => toggleMuscleGroup(group)}
                        disabled={isSaving}
                    >
                        <Text style={[
                            styles.muscleGroupText,
                            selectedMuscleGroups.includes(group) && styles.muscleGroupTextActive
                        ]}>{group}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            [Image of the main muscle groups used in resistance training]

            {/* Suggested Exercises */}
            {selectedMuscleGroups.length > 0 && (
                <View style={styles.suggestionsCard}>
                    <Text style={styles.suggestionsHeader}>2. Suggested Exercises</Text>
                    {suggestedExercises.length > 0 ? (
                        suggestedExercises.map(ex => (
                            <View key={ex.name} style={styles.suggestionItem}>
                                <Text style={styles.suggestionText}>
                                    {ex.name} <Text style={styles.suggestionDetail}>({ex.muscleGroup} / {ex.equipment})</Text>
                                </Text>
                                <TouchableOpacity 
                                    style={styles.addButton}
                                    onPress={() => addSuggestedExercise(ex.name)}
                                    disabled={isSaving}
                                >
                                    <Ionicons name="add-circle" size={24} color="#10B981" />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.suggestionText}>No exercises found for these groups.</Text>
                    )}
                </View>
            )}

            {/* Logged Exercises (The main workout entry) */}
            <Text style={styles.subHeader}>3. Logged Workout Details ({form.loggedExercises.length} Exercises)</Text>
            {form.loggedExercises.map((ex, index) => (
                <View key={index} style={styles.loggedExerciseCard}>
                    <View style={styles.loggedHeaderRow}>
                        <Text style={styles.loggedName}>{ex.name}</Text>
                        <TouchableOpacity onPress={() => removeLoggedExercise(index)}>
                             <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.rowItem}>
                            <Text style={styles.labelSmall}>Sets</Text>
                            <TextInput
                                style={styles.inputSmall}
                                keyboardType="numeric"
                                value={ex.sets}
                                onChangeText={(text) => updateLoggedExercise(index, 'sets', text)}
                                disabled={isSaving}
                            />
                        </View>
                        <View style={styles.rowItem}>
                            <Text style={styles.labelSmall}>Reps</Text>
                            <TextInput
                                style={styles.inputSmall}
                                keyboardType="numeric"
                                value={ex.reps}
                                onChangeText={(text) => updateLoggedExercise(index, 'reps', text)}
                                disabled={isSaving}
                            />
                        </View>
                        <View style={styles.rowItem}>
                            <Text style={styles.labelSmall}>Weight</Text>
                            <TextInput
                                style={styles.inputSmall}
                                keyboardType="numeric"
                                value={ex.weight}
                                onChangeText={(text) => updateLoggedExercise(index, 'weight', text)}
                                disabled={isSaving}
                            />
                        </View>
                    </View>
                </View>
            ))}

            {/* Notes Input */}
            <Text style={styles.label}>Notes / Comments</Text>
            <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="How did the session feel? Any pain?"
                multiline
                value={form.notes}
                onChangeText={(text) => handleChange('notes', text)}
                disabled={isSaving}
            />
            
            {/* Save Button */}
            <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveWorkout}
                disabled={isSaving || form.loggedExercises.length === 0}
            >
                {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.saveButtonText}>Complete & Log Workout</Text>
                )}
            </TouchableOpacity>

            <View style={{height: 50}} /> 
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4F46E5',
    },
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    contentContainer: {
        padding: 20,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 25,
        textAlign: 'center',
    },
    subHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 30,
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 5,
        marginTop: 15,
    },
    labelSmall: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    inputSmall: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        padding: 8,
        borderRadius: 6,
        fontSize: 14,
        textAlign: 'center',
    },
    notesInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    typeSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
        marginBottom: 10,
    },
    typeButton: {
        flex: 1,
        marginHorizontal: 4,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: '#4F46E5',
    },
    typeButtonText: {
        fontWeight: '600',
        color: '#1F2937',
    },
    typeButtonTextActive: {
        color: '#FFFFFF',
    },
    muscleGroupContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    muscleGroupButton: {
        width: '32%',
        padding: 10,
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    muscleGroupButtonActive: {
        backgroundColor: '#34D399',
        borderColor: '#10B981',
    },
    muscleGroupText: {
        fontWeight: '600',
        color: '#374151',
        fontSize: 14,
    },
    muscleGroupTextActive: {
        color: '#1F2937',
    },
    suggestionsCard: {
        backgroundColor: '#E0F7FA', // Light blue background
        padding: 15,
        borderRadius: 10,
        marginTop: 15,
        borderLeftWidth: 5,
        borderLeftColor: '#00BCD4',
    },
    suggestionsHeader: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
        color: '#00BCD4',
    },
    suggestionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#B2EBF2',
    },
    suggestionText: {
        fontSize: 15,
        color: '#006064',
        flexShrink: 1,
        paddingRight: 10,
    },
    suggestionDetail: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#4DD0E1',
    },
    addButton: {
        padding: 5,
    },
    loggedExerciseCard: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    loggedHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    loggedName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4F46E5',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    rowItem: {
        flex: 1,
        marginHorizontal: 5,
    },
    saveButton: {
        backgroundColor: '#10B981', 
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    }
});