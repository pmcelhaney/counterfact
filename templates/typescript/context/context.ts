// Add whatever methods you want to this class.
// Use it to store and retrieve data, implement logic, etc.
// You can connect to a database, call other services, whatever makes sense.

export class Context {
  private greeting = "Hello";

  public setGreeting(greeting: string): void {
    this.greeting = greeting;
  }

  public message(): string {
    return `${this.greeting} World!`;
  }
}

// Counterfact will load this object and pass it into the GET() / POST() / PUT() / DELETE() functions.
export const context = new Context();
