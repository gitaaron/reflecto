import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Zoom Transcription Log',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const TranscriptionLogPage(),
    );
  }
}

class TranscriptionLogPage extends StatefulWidget {
  const TranscriptionLogPage({super.key});

  @override
  TranscriptionLogPageState createState() => TranscriptionLogPageState();
}

class TranscriptionLogPageState extends State<TranscriptionLogPage> {
  List<dynamic> _log = [];

  @override
  void initState() {
    super.initState();
    _fetchLog();
  }

  Future<void> _fetchLog() async {
    final response =
        await http.get(Uri.parse('https://reflecto.vercel.app/api/get-log'));

    if (response.statusCode == 200) {
      setState(() {
        _log = json.decode(response.body);
      });
    } else {
      print('Failed to fetch log');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Zoom Transcription Log'),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchLog,
        child: ListView.builder(
          itemCount: _log.length,
          itemBuilder: (context, index) {
            final entry = _log[index];
            return ListTile(
              title: Text('Meeting ID: ${entry['id']}'),
              subtitle: Text('Transcription: ${entry['transcription']}'),
            );
          },
        ),
      ),
    );
  }
}
