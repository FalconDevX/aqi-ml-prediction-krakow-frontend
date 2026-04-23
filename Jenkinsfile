pipeline {
  agent any
  stages {
    stage('Clone') {
      steps {
        checkout scm
        sh 'echo "Start build: $GIT_COMMIT" > frontend_build_logs.txt'
      }
    }

    stage('Build & Test') {
      agent {
        docker {
          image 'node:20-alpine'
        }

      }
      steps {
        sh 'npm install >> frontend_build_logs.txt'
        sh 'npm run build >> frontend_build_logs.txt'
        sh 'npm test'
      }
    }

    stage('Build Docker Image') {
      steps {
        script {
          docker.build(
            "${DOCKER_IMAGE}:${DOCKER_TAG}",
            "--build-arg GIT_COMMIT=${env.GIT_COMMIT} ."
          )
        }

      }
    }

    stage('Deploy & Smoke Test') {
      post {
        always {
          sh "docker stop aqi-test-${BUILD_ID} || true"
          sh "docker rm aqi-test-${BUILD_ID} || true"
        }

      }
      steps {
        script {
          sh """
          docker run -d --name aqi-test-${BUILD_ID} -p 8081:3000 ${DOCKER_IMAGE}:${DOCKER_TAG}
          """

          sh """
          for i in \$(seq 1 10); do
            if curl -fsS -H "User-Agent: Jenkins" http://localhost:8081/api/health > /dev/null; then
              break
            fi
            echo "Waiting for app..."
            sleep 2
          done

          curl -fsS -H "User-Agent: Jenkins" http://localhost:8081/api/health || {
            docker logs aqi-test-${BUILD_ID}
            exit 1
          }
          """
        }

      }
    }

    stage('Publish') {
      steps {
        archiveArtifacts(artifacts: 'frontend_build_logs.txt', fingerprint: true)
        script {
          docker.withRegistry('https://index.docker.io/v1/', 'DOCKER_HUB_CREDS') {
            def img = docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}")
            img.push()
            img.push('latest')
          }
        }

      }
    }

  }
  environment {
    DOCKER_IMAGE = 'falcondevx/aqi-frontend'
    DOCKER_TAG = "v1.0.${env.BUILD_ID}-${env.GIT_COMMIT.take(7)}"
  }
  post {
    success {
      echo "SUCCESS: ${DOCKER_TAG}"
    }

    failure {
      echo 'FAILED - sprawdź logi'
    }

  }
}
