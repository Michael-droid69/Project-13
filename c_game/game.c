#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <conio.h>
#include <windows.h>

#define MAX_BEHAVIORS 13
#define FILENAME "scores.txt"

typedef struct {
    char color[20];
    char meaning[30];
    int score;
} Behavior;

typedef struct Node {
    Behavior behavior;
    struct Node* next;
} Node;

Behavior behaviors[MAX_BEHAVIORS] = {
    {"Pink", "Love", 20},
    {"Green", "Peace", 15},
    {"Blue", "Silence", 12},
    {"Red", "Anger", 10},
    {"Yellow", "Hope", 14},
    {"Purple", "Fear", 9},
    {"Orange", "Joy", 13},
    {"White", "Innocence", 11},
    {"Black", "Death", 999},
    {"Teal", "Acceptance", 16},
    {"Gray", "Doubt", 7},
    {"Cyan", "Curiosity", 17},
    {"Gold", "Wisdom", 18}
};

char *obstacles[] = { "rock", "crack", "spikes", "hole", "fire" };
char *traps[] = { "birds", "missile", "fallen tree", "barbwire" };
char *ballSymbols[] = { "@", "0", "o" };
#define OBSTACLE_COUNT 5
#define TRAP_COUNT 4

// Animate rolling ball
void simulateRollingBall() {
    int symbolIndex = rand() % 3;
    const char* symbol = ballSymbols[symbolIndex];
    for (int i = 0; i < 40; i++) {
        system("cls");
        for (int j = 0; j < i; j++) printf(" ");
        printf("%s\n", symbol);
        Sleep(20);
    }
}

// Timed input (Y/N in 3 seconds)
int waitForYesNoInput(int seconds) {
    int wait = 0;
    while (wait < seconds * 10) {
        if (_kbhit()) {
            char ch = _getch();
            if (ch == 'y' || ch == 'Y') return 1;
            if (ch == 'n' || ch == 'N') return 0;
            return -2;
        }
        Sleep(100);
        wait++;
    }
    return -1;
}

// Save score to file
void saveScoreToFile(const char* username, const char* password, int lights, int score) {
    FILE* f = fopen(FILENAME, "a");
    if (!f) {
        printf("Error saving score.\n");
        return;
    }
    fprintf(f, "%s,%s,%d,%d\n", username, password, lights, score);
    fclose(f);
}

// Check existing login
int checkCredentials(const char* username, const char* password) {
    FILE* f = fopen(FILENAME, "r");
    if (!f) return 0;

    char line[150], fileUser[50], filePass[50];
    while (fgets(line, sizeof(line), f)) {
        sscanf(line, "%[^,],%[^,],", fileUser, filePass);
        if (strcmp(username, fileUser) == 0 && strcmp(password, filePass) == 0) {
            fclose(f);
            return 1; // valid
        }
    }
    fclose(f);
    return 0;
}

// Check duplicate user
int isUsernameTaken(const char* username) {
    FILE* f = fopen(FILENAME, "r");
    if (!f) return 0;
    char line[150], stored[50];
    while (fgets(line, sizeof(line), f)) {
        sscanf(line, "%[^,]", stored);
        if (strcmp(stored, username) == 0) {
            fclose(f);
            return 1;
        }
    }
    fclose(f);
    return 0;
}

int main() {
    srand(time(NULL));
    char username[50], password[50];
    int loggedIn = 0;

    printf("🎮 Welcome to the Light Collector Game!\n");

    while (!loggedIn) {
        printf("\nChoose:\n");
        printf("1. Register (new user)\n");
        printf("2. Login (existing user)\n");
        printf("Enter option (1 or 2): ");

        int choice;
        scanf("%d", &choice);
        getchar(); // flush newline

        if (choice == 1) {
            printf("Enter a new unique username: ");
            scanf("%s", username);
            printf("Enter a password: ");
            scanf("%s", password);

            if (isUsernameTaken(username)) {
                printf("Username already exists. Try logging in.\n");
            } else {
                printf("Account created!\n");
                loggedIn = 1;
                break;
            }

        } else if (choice == 2) {
            printf("Username: ");
            scanf("%s", username);
            printf("Password: ");
            scanf("%s", password);

            if (checkCredentials(username, password)) {
                printf("Login successful!\n");
                loggedIn = 1;
                break;
            } else {
                printf("Incorrect login.\n");
            }
        } else {
            printf("Invalid option.\n");
        }
    }

    printf("Play the game? (y/n): ");
    if (!waitForYesNoInput(3)) {
        printf("\nGoodbye!\n");
        return 0;
    }

    int totalScore = 0, lightsCollected = 0;
    int steps = 0;
    int collectedFlags[MAX_BEHAVIORS] = {0};
    Node* collectedList = NULL;

    while (steps < 25) {
        steps++;
        printf("\n[Step %d] Rolling...\n", steps);
        simulateRollingBall();

        int eventType = rand() % 3;

        if (eventType == 0) {
            int obsIndex = rand() % OBSTACLE_COUNT;
            printf("Obstacle ahead: %s! Jump? (y/n): ", obstacles[obsIndex]);
            int result = waitForYesNoInput(3);
            if (result == 1) {
                printf("You cleared the %s!\n", obstacles[obsIndex]);
                continue;
            } else {
                printf("You failed to avoid the %s. GAME OVER.\n", obstacles[obsIndex]);
                break;
            }

        } else if (eventType == 2) {
            int trapIndex = rand() % TRAP_COUNT;
            printf("TRAP: %s incoming! Jump? (y/n): ", traps[trapIndex]);
            int result = waitForYesNoInput(3);
            if (result == 0) {
                printf("Smart move. You ducked under the %s.\n", traps[trapIndex]);
                continue;
            } else {
                printf("Oops. You got hit by the %s. GAME OVER.\n", traps[trapIndex]);
                break;
            }

        } else {
            int index = rand() % MAX_BEHAVIORS;
            if (collectedFlags[index]) continue;

            printf("A %s light (%s) appears. Collect it? (y/n): ",
                   behaviors[index].color, behaviors[index].meaning);
            int result = waitForYesNoInput(3);

            if (strcmp(behaviors[index].color, "Black") == 0) {
                if (result == 1) {
                    printf("You touched black... Death. GAME OVER.\n");
                    break;
                } else {
                    printf("You avoided the black light.\n");
                    continue;
                }
            }

            if (result == 1) {
                printf("You collected it!\n");
                totalScore += behaviors[index].score;
                lightsCollected++;
                collectedFlags[index] = 1;

                Node* newNode = (Node*)malloc(sizeof(Node));
                newNode->behavior = behaviors[index];
                newNode->next = collectedList;
                collectedList = newNode;
            } else {
                printf("Ignored.\n");
            }

            if (lightsCollected == MAX_BEHAVIORS - 1) {
                printf("You collected all safe lights!\n");
                break;
            }
        }
    }

    // Final screen
    printf("\n===========================\n");
    printf("         GAME OVER         \n");
    printf("===========================\n");
    printf("User: %s\n", username);
    printf("Lights Collected: %d\n", lightsCollected);
    printf("Score: %d\n", totalScore);

    saveScoreToFile(username, password, lightsCollected, totalScore);
    printf("\nSaved to '%s'.\n", FILENAME);
    printf("Leaderboard will read this file.\n");

    Node* current = collectedList;
    while (current) {
        printf("Collected: %s (%s) [+%d pts]\n",
               current->behavior.meaning,
               current->behavior.color,
               current->behavior.score);
        Node* temp = current;
        current = current->next;
        free(temp);
    }

    return 0;
}
