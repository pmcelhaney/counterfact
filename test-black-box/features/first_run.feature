Feature: Find a useful starting point on the first run
  An unconfigured developer can discover a contract or learn Counterfact,
  while existing projects and unattended commands preserve their behavior.

  Scenario: Start a discovered nested contract
    Given a first-run directory with a nested OpenAPI contract and unrelated files
    When I run Counterfact without arguments in a terminal
    Then the intro offers a guided example, my own document, and documentation
    When I choose my OpenAPI document
    Then only supported local contracts are offered
    When I select the nested contract and an available server port
    Then the generated API and Swagger UI work and the REPL accepts requests

  Scenario Outline: Cancel a first run without writing files
    Given an empty first-run directory
    When I run Counterfact without arguments in a terminal
    When I cancel the intro using <method>
    Then Counterfact exits successfully without generating files

    Examples:
      | method               |
      | q                    |
      | Ctrl+C               |
      | Ctrl+D               |
      | q at the destination |
      | q before starting example    |

  Scenario: Read documentation without starting a project
    Given an empty first-run directory with a browser launcher
    When I run Counterfact without arguments in a terminal
    And I choose documentation
    Then the documentation URL is handed to the browser without generating files

  Scenario: Leave an unattended first run immediately
    Given an empty first-run directory
    When I run Counterfact without arguments without a terminal
    Then Counterfact prints explicit startup guidance and exits without generating files

  Scenario: Leave a CI first run even with a terminal
    Given an empty first-run directory running in CI
    When I run Counterfact without arguments in a terminal
    Then Counterfact prints explicit startup guidance and exits without generating files

  Scenario: Preserve configured and explicit startup
    Given a configured project with a local contract
    When I run Counterfact without arguments without a terminal
    Then the configured output is generated without an intro
    When I run Counterfact with an explicit spec and output override
    Then the explicit output is generated without an intro

  Scenario: Report a selected contract loading error
    Given a first-run contract with a missing reference
    When I run Counterfact without arguments in a terminal
    And I select the nested contract and an available server port
    Then Counterfact reports the loading error and exits unsuccessfully

  Scenario: Report configuration errors before offering an intro
    Given a first-run directory with a malformed default config
    When I run Counterfact without arguments without a terminal
    Then Counterfact reports the config error without offering an intro

  Scenario: Preserve explicit startup without a config
    Given an empty first-run directory with a local contract
    When I explicitly generate from the contract and then without OpenAPI
    Then explicit positional and action-only commands generate without an intro

  Scenario: Select and watch a local spec whose filename looks like a URL
    Given a first-run contract named http:spec.json
    When I run Counterfact without arguments in a terminal
    And I select the contract whose filename looks like a URL
    Then the generated API and Swagger UI work and the REPL accepts requests
    When I change the selected contract's response example
    Then the running API reloads the local contract change

  Scenario: Change a running API through the guided example
    Given an empty first-run directory
    When I run Counterfact without arguments in a terminal
    Then the intro offers a guided example, my own document, and documentation
    When I start the guided example on an available port
    Then the example starts without downloading a contract
    When I request another ticket and repeat the tutorial instructions
    Then the tutorial still asks for the first ticket
    When I request the example ticket
    Then the tutorial points to the editable handler
    When I save a closed status in the example handler and request the ticket again
    Then the tutorial completes and the API remains usable

  Scenario: Recover from an unsuccessful edit and leave the tutorial
    Given an empty first-run directory
    When I run Counterfact without arguments in a terminal
    And I start the guided example on an available port
    And I request the example ticket
    And I request the unchanged ticket
    Then the tutorial asks me to save and retry
    When I break the example handler and request the ticket
    Then the tutorial does not report completion
    When I restore the example handler and skip the tutorial
    Then the ordinary REPL and API remain usable and my files are kept

  Scenario: Preserve an existing example and choose an available port
    Given an existing example directory and an occupied server port
    When I run Counterfact without arguments in a terminal
    And I return from example setup to the opening menu
    And I start the example after correcting an occupied port
    Then the existing example is unchanged and the new example runs

  Scenario: Enter a contract path and return from document selection
    Given an empty first-run directory with a local contract
    When I run Counterfact without arguments in a terminal
    And I return from document selection to the opening menu
    And I enter the contract path and choose an available server port
    Then the generated API and Swagger UI work and the REPL accepts requests

  Scenario: Return from an empty document chooser without creating files
    Given an empty first-run directory
    When I run Counterfact without arguments in a terminal
    And I choose my OpenAPI document
    Then the intro reports that no local contracts were found
    When I go back and quit the intro
    Then Counterfact exits successfully without generating files

  Scenario: Start an API from an entered contract URL
    Given a contract served at a local HTTP URL
    When I run Counterfact without arguments in a terminal
    And I enter the contract URL and choose an available server port
    Then the generated API and Swagger UI work and the REPL accepts requests

  Scenario: Shop for coffee against the generated Counterfact API
    Given an empty first-run directory
    When I run Counterfact without arguments in a terminal
    And I start the guided example on an available port
    Then the coffee shop serves products and accepts a demo purchase
